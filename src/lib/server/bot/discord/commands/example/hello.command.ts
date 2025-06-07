import { defineSubcommand } from "@l3dev/discord.js-helpers";
import { err, Result } from "@l3dev/result";

export default defineSubcommand({
	name: "hello",
	define(builder) {
		return builder
			.setName(this.name)
			.addStringOption((option) => option.setName("input").setRequired(true));
	},
	async execute(interaction) {
		if (interaction.applicationId === "asdkhjasd") {
			return err("UH_OH");
		}

		return await Result.fromPromise({ onError: { type: "REPLY" } }, interaction.reply("Hello!"));
	}
});
