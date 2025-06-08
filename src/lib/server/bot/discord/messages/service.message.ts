import { defineMessage, okMessage } from "@l3dev/discord.js-helpers";
import { ContainerBuilder } from "discord.js";

export const serviceMessage = defineMessage({
	build: () => {
		const container = new ContainerBuilder();

		container.addActionRowComponents();

		return okMessage({
			components: [container]
		});
	}
});
