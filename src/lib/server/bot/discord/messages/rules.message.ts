import { defineMessage, okMessage } from "@versetools/discord.js-helpers";
import { ContainerBuilder, MessageFlags } from "discord.js";

import { config } from "$lib/config";

import { ChannelIds, RoleIds } from "../ids";

type Rule = {
	name: string;
	description: string;
};

type RoleDefinition = {
	id: string;
	description: string;
};

const rules = [
	{
		name: "Be Professional & Respectful",
		description:
			"Treat all members with courtesy. Harassment, discrimination, personal attacks, or disrespectful behaviour of any kind will not be tolerated."
	},
	{
		name: "Stay On-Topic",
		description: `Keep conversations relevant to ${config.name} products and related topics (e.g., integrations, feedback, support). Off-topic chat should be directed to the appropriate channels.`
	},
	{
		name: "No Spam or Self-Promotion",
		description:
			"Unsolicited promotions, links, or repeated messages are not allowed. This includes DMs to other members. If you'd like to share something related to the product or ecosystem, ask a moderator first."
	},
	{
		name: "Keep Support Requests in Designated Channels",
		description:
			"If you need help, please use the appropriate support or help channels. This helps the team and community assist you more efficiently."
	},
	{
		name: "Use Clear, Constructive Language",
		description:
			"When giving feedback or reporting issues, be specific, polite, and helpful. We're here to build something great together."
	},
	{
		name: "Respect Privacy",
		description:
			"Do not share personal information (yours or others') in public channels. This includes emails, phone numbers, and private account details."
	},
	{
		name: "No NSFW or Offensive Content",
		description:
			"This is a professional space. Content that is offensive, explicit, or inappropriate in any context will be removed and result in an immediate ban."
	},
	{
		name: "Follow Discord's Community Guidelines",
		description:
			"All members must adhere to Discord's [Terms of Service](https://discord.com/terms) and [Community Guidelines](https://discord.com/guidelines)."
	},
	{
		name: "Listen to the Moderators",
		description:
			"Our moderators are here to keep the server safe and productive. Please follow their guidance and reach out if you have questions or concerns."
	}
] satisfies Rule[];

const roleDefinitions = [
	{
		id: RoleIds.developer,
		description: `The people who work on ${config.name} products and services to make them a reality!`
	},
	{
		id: RoleIds.moderator,
		description:
			"Trusted volunteers of the community who help keep the Discord a safe place for everyone!"
	}
] satisfies RoleDefinition[];

export const rulesMessage = defineMessage({
	build: () => {
		const container = new ContainerBuilder();

		container.addMediaGalleryComponents((gallery) =>
			gallery.addItems((item) =>
				item.setURL(
					"https://cdn.discordapp.com/attachments/1360999994059919521/1365630848279515248/logo.png?ex=68114e16&is=680ffc96&hm=83f1868d366f372c418ec38634e042b8460e33154b6bf2d9227a95c0f525113b&"
				)
			)
		);

		container.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(`# Rules
Please follow these rules to help keep the ${config.name} Discord a pleasant place for everyone:
${rules.map((rule, index) => `### ${index + 1}. ${rule.name}\n> ${rule.description}`).join("\n")}

Please report potential violations of these rules by opening a ticket in <#${ChannelIds.moderationTickets}> or pinging a <@&${RoleIds.moderator}>. Any posts or content that conflicts with these rules may be deleted, and offenders may be banned without warning.

## Role Definitions

${roleDefinitions.map((def) => `<@&${def.id}>\n${def.description}`).join("\n\n")}`)
		);

		return okMessage({
			flags: MessageFlags.IsComponentsV2,
			components: [container]
		});
	}
});
