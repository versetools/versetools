import { Axiom } from "@axiomhq/js";
import type { ILogObjMeta } from "tslog";

export function axiomTransport({
	token,
	dataset,
	metaProperty = "_meta",
	getAdditionalMeta
}: {
	token: string;
	dataset: string;
	metaProperty?: string;
	getAdditionalMeta?: () => Record<string, any>;
}) {
	const axiom = new Axiom({
		token
	});

	process.on("beforeExit", async () => {
		await axiom.flush();
	});

	return function (log: ILogObjMeta) {
		const { [metaProperty]: meta, ...rest } = log;

		const level = mapLogLevel(meta.logLevelName);

		axiom.ingest(dataset, {
			_time: meta.date,
			level,
			_meta: {
				runtime: meta.runtime,
				path: meta.path,
				...getAdditionalMeta?.()
			},
			...rest
		});
	};
}

function mapLogLevel(level: string) {
	level = level.toLowerCase();

	if (level === "silly") {
		return "silent";
	}

	return level;
}
