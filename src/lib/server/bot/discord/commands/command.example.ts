import {
	addSubcommands,
	createSubcommandExecutor,
	defineCommand,
	loadSubcommands
} from "@versetools/discord.js-helpers";

import { logger } from "$server/utils/logger";

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
