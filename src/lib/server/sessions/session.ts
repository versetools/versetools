import { err, NONE, ok, Result } from "@l3dev/result";
import type { RequestEvent } from "@sveltejs/kit";
import { parse, serialize, type SerializeOptions } from "cookie";
import { eq } from "drizzle-orm";
import * as iron from "iron-webcrypto";

import { db, safeExecute, tables, type DbAdminUser, type DbUserSession } from "$server/db";

const SEAL_VERSION = 1;
const FOURTEEN_DAYS_IN_SECONDS = 14 * 24 * 3600;

type Secret = string | Record<string, string>;
type CookieOptions = { name: string } & SerializeOptions;

const seal = Result.fn(async function (
	data: any,
	secret: Secret,
	ttl: number = FOURTEEN_DAYS_IN_SECONDS
) {
	const secrets = typeof secret === "string" ? { 1: secret } : secret;

	const latestSecretId = Math.max(...Object.keys(secrets).map(Number));
	const sealSecret = {
		id: latestSecretId.toString(),
		secret: secrets[latestSecretId]
	};

	const sealResult = await Result.fromPromise(
		iron.seal(crypto, data, sealSecret, {
			...iron.defaults,
			ttl: ttl * 1000
		})
	);
	if (!sealResult.ok) {
		return err("SEAL_FAILED", {
			error: sealResult.context.error
		});
	}

	return ok(`${sealResult.value}~${SEAL_VERSION}`);
});

const unseal = Result.fn(async function <T>(
	sealed: string,
	secret: Secret,
	ttl: number = FOURTEEN_DAYS_IN_SECONDS
) {
	const secrets = typeof secret === "string" ? { 1: secret } : secret;

	const [sealedData, sealVersionString] = sealed.split("~");
	// For future use
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const sealedVersion = sealVersionString ? parseInt(sealVersionString, 10) : null;

	const unsealResult = await Result.fromPromise(
		iron.unseal(crypto, sealedData, secrets, {
			...iron.defaults,
			ttl: ttl * 1000
		}) as Promise<T>
	);

	if (
		!unsealResult.ok &&
		unsealResult.context.error instanceof Error &&
		/^(Expired seal|Bad hmac value|Cannot find password|Incorrect number of sealed components)/.test(
			unsealResult.context.error.message
		)
	) {
		// if seal expired or
		// if seal is not valid (encrypted using a different password, when passwords are badly rotated) or
		// if we can't find back the password in the seal
		// then we just start a new session over
		return ok(null);
	} else if (!unsealResult.ok) {
		return err("UNSEAL_FAILED", {
			error: unsealResult.context.error
		});
	}

	return ok(unsealResult.value ?? null);
});

function generateKey() {
	const bytes = iron.randomBits(crypto, 24 * 8);
	const buffer = Buffer.from(bytes);

	return buffer.toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

type SessionProp = keyof typeof SessionImpl.prototype;

export class SessionImpl {
	private static readonly publicReadProperties: SessionProp[] = [
		"user",
		"key",
		"fresh",
		"ip",
		"geolocation",
		"userAgent"
	];
	private static readonly publicWriteProperties: SessionProp[] = ["user"];

	public user: DbAdminUser["id"] | null = null;
	public readonly ip: string;
	public readonly geolocation: string;
	public readonly userAgent: string;

	private _key: string = "*";
	public get key() {
		return this._key;
	}

	private _fresh: boolean = false;
	public get fresh() {
		return this._fresh;
	}

	private event: RequestEvent;

	private secret: Secret;
	private ttl: number;
	private cookieOptions: CookieOptions;

	private data: App.Session = {};
	private dbSession: DbUserSession | null = null;

	constructor(
		event: RequestEvent,
		options: { secret: Secret; ttl?: number; cookie: CookieOptions }
	) {
		if (event instanceof Request) {
			event.cookies = {
				getAll(opts) {
					const header = event.headers.get("cookie");
					return header
						? Object.entries(parse(header, opts)).map(([name, value]) => ({ name, value: value! }))
						: [];
				},
				get(name, opts) {
					return this.getAll(opts).find((cookie) => cookie.name === name)?.value;
				},
				serialize(name, value, opts) {
					return serialize(name, value, opts);
				},
				set(_name, _value, _opts) {
					throw new Error("Not supported");
				},
				delete(_name, _opts) {
					throw new Error("Not supported");
				}
			};
		}

		this.event = event;

		this.ip = SessionImpl.getIp(event);
		this.geolocation = "unknown";
		this.userAgent = event.request.headers.get("user-agent") ?? "unknown";

		this.secret = options.secret;
		this.ttl = options.ttl ?? FOURTEEN_DAYS_IN_SECONDS;
		this.cookieOptions = options.cookie;

		return new Proxy(this, {
			get: (target, prop) => {
				const value = target[prop as SessionProp];
				if (typeof value === "function") {
					return value.bind(target);
				}

				if (SessionImpl.publicReadProperties.includes(prop as SessionProp)) {
					return value;
				}

				const dataValue = (target.data as any)[prop];
				return typeof dataValue === "function" ? dataValue.bind(target.data) : dataValue;
			},
			set: (target, prop, value) => {
				if (SessionImpl.publicWriteProperties.includes(prop as SessionProp)) {
					target[prop as keyof typeof this] = value;
				} else {
					(target.data as any)[prop] = value;
				}
				return true;
			}
		});
	}

	public init = Result.fn(async function (this: SessionImpl) {
		if (this._key !== "*") return NONE;
		const cookieResult = await this.getCookie();
		if (!cookieResult.ok) {
			return cookieResult;
		}

		if (cookieResult.value) {
			const loadResult = await this.load(cookieResult.value);
			if (loadResult.ok) {
				this._key = cookieResult.value;
				return NONE;
			}
		}

		this._key = generateKey();
		this._fresh = true;

		return Result.all(await this.save(), await this.setCookie());
	});

	public save = Result.fn(async function (this: SessionImpl) {
		const update = {
			ip: this.ip,
			geolocation: this.geolocation,
			userAgent: this.userAgent,
			data: this.data as App.Session,
			expiresAt: new Date(Date.now() + this.ttl * 1000),
			userId: this.user
		};

		const result = await safeExecute(
			"UPSERT_USER_SESSION",
			db
				.insert(tables.userSessions)
				.values({
					key: this._key,
					...update
				})
				.onConflictDoUpdate({
					target: tables.userSessions.key,
					set: {
						...update
					}
				})
		);
		if (!result.ok) {
			return err("SESSION_SAVE_FAILED", {
				error: result.context.error
			});
		}

		this.dbSession = {
			...this.dbSession,
			...update,
			key: this._key,
			updatedAt: new Date(),
			createdAt: this.dbSession?.createdAt ?? new Date()
		};

		return NONE;
	});

	public login = Result.fn(async function (
		this: SessionImpl,
		user: DbAdminUser | { id: DbAdminUser["id"] }
	) {
		this.user = user.id;
		this.data.oauth = null;
		this.data.oauth_error = null;

		return await this.save();
	});

	public logout = Result.fn(async function (this: SessionImpl) {
		this.user = null;
		this.data.oauth = null;
		this.data.oauth_error = null;

		return await this.save();
	});

	public destroy = Result.fn(async function (this: SessionImpl) {
		const result = await safeExecute(
			"DELETE_USER_SESSION",
			db.delete(tables.userSessions).where(eq(tables.userSessions.key, this._key))
		);
		if (!result.ok) {
			return err("SESSION_DESTROY_FAILED", {
				error: result.context.error
			});
		}
		this.removeCookie();

		return NONE;
	});

	public toDbUserSession(): DbUserSession {
		return {
			...this.dbSession,
			key: this._key,
			ip: this.ip,
			geolocation: this.geolocation,
			userAgent: this.userAgent,
			data: this.data as App.Session,
			expiresAt: new Date(Date.now() + this.ttl * 1000),
			updatedAt: this.dbSession?.updatedAt ?? new Date(),
			createdAt: this.dbSession?.createdAt ?? new Date(),
			userId: this.user
		};
	}

	private load = Result.fn(async function (this: SessionImpl, key: string) {
		const sessionResult = await safeExecute(
			"QUERY_USER_SESSION",
			db.query.userSessions.findFirst({
				where: eq(tables.userSessions.key, key)
			})
		);
		if (!sessionResult.ok) {
			return err("SESSION_QUERY_FAILED", {
				error: sessionResult.context.error
			});
		}

		const session = sessionResult.value as DbUserSession | null;
		if (!session) {
			return err("SESSION_NOT_FOUND");
		} else if (session.expiresAt < new Date()) {
			return err("SESSION_EXPIRED");
		}

		this.dbSession = session;
		this.data = typeof session.data === "object" ? session.data : {};
		this.user = session.userId;

		return NONE;
	});

	private getCookie = Result.fn(async function (this: SessionImpl) {
		const cookie = this.event.cookies.get(this.cookieOptions.name);
		if (!cookie) return ok(null);

		return await unseal<string>(cookie, this.secret, this.ttl);
	});

	private setCookie = Result.fn(async function (this: SessionImpl) {
		const valueResult = await seal(this._key, this.secret, this.ttl);
		if (!valueResult.ok) {
			return valueResult;
		}

		const { name: cookieName, ...options } = this.cookieOptions;
		this.event.cookies.set(cookieName, valueResult.value, {
			...options,
			maxAge: this.ttl,
			path: options.path ?? "/"
		});

		return NONE;
	});

	private removeCookie() {
		const { name: cookieName, ...options } = this.cookieOptions;
		this.event.cookies?.delete(cookieName, {
			...options,
			maxAge: this.ttl,
			path: options.path ?? "/"
		});
	}

	private static getIp(event: RequestEvent) {
		const cloudflareConnectingIp = event.request.headers.get("cf-connecting-ip");
		if (cloudflareConnectingIp && cloudflareConnectingIp !== "undefined") {
			return cloudflareConnectingIp;
		}

		const ipHeader =
			event.request.headers.get("x-real-ip") ?? event.request.headers.get("x-forwarded-for");
		if (ipHeader) {
			const ips = ipHeader.split(",").map((v) => v.trim());
			return ips[0];
		}

		return "::1";
	}
}

export type Session = SessionImpl & App.Session;
