import { defineEventListener } from "@l3dev/discord.js-helpers";
import { NONE } from "@l3dev/result";
import { Events } from "discord.js";

const testChannelId = "1366674973313208403";
// const rulesChannelId = "1360999994059919521";

export default defineEventListener({
	event: Events.ClientReady,
	listener: async function (client) {
		// const channel =
		// 	client.channels.cache.get(testChannelId) ?? (await client.channels.fetch(testChannelId));
		// if (!channel) {
		// 	return err("CHANNEL_NOT_FOUND");
		// }

		// if (!channel.isTextBased() || !channel.isSendable()) {
		// 	return err("CHANNEL_NOT_TEXT_BASED");
		// }

		// const messageResult = openTicketMessage.build();
		// if (!messageResult.ok) return messageResult;

		// const sendResult = await Result.fromPromise(channel.send(messageResult.value));

		// if (!sendResult.ok) return sendResult;

		return NONE;
	}
});
