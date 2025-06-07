import { defineEventListener } from "@l3dev/discord.js-helpers";
import { NONE } from "@l3dev/result";
import { Events } from "discord.js";

import { env } from "$env/dynamic/private";

export default defineEventListener({
	event: Events.GuildMemberAdd,
	listener: async function (member) {
		if (member.guild.id !== env.DISCORD_GUILD_ID) return NONE;

		// TODO: Do something

		return NONE;
	}
});
