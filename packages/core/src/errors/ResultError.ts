import { err, type Err } from "@l3dev/result";
import { ConvexError, type Value } from "convex/values";

export type ResultErrorToErr<T extends ResultError<any, any>> =
	T extends ResultError<infer Type, infer Context> ? Err<Type, Context> : never;

export class ResultError<const T extends string, TContext extends Value> extends ConvexError<{
	type: T;
	context: TContext;
}> {
	public static from<TErr extends Err<any, any>>(err: TErr) {
		return new ResultError<TErr["type"], TErr["context"]>(err.type, err.context);
	}

	constructor(type: T, context: TContext = null as TContext) {
		super({
			type,
			context
		});
	}

	public toErr() {
		return err(this.data.type, this.data.context);
	}
}
