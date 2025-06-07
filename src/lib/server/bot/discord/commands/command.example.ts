import {
	addSubcommands,
	createSubcommandExecutor,
	defineCommand,
	loadSubcommands
} from "@l3dev/discord.js-helpers";
import { logger } from "@l3dev/logger";

import { commandExecutor } from "./executor";
import { errorMessage } from "../messages/error.message";

const subcommands = loadSubcommands({
	parentCommandName: "example",
	getModules<T>() {
		return import.meta.glob<true, string, T>("./example/*.command.ts", {
			eager: true
		});
	},
	logger
});

const command = defineCommand({
	name: "example",
	subcommands,
	define(builder) {
		builder = builder.setName(this.name);
		addSubcommands(builder, subcommands);

		return builder;
	},
	execute: createSubcommandExecutor({
		subcommands,
		commandExecutor,
		getNotFoundMessage(subcommandName, _interaction) {
			return errorMessage.build(`Unknown subcommand '${subcommandName}'`);
		}
	})
});

export default command;
