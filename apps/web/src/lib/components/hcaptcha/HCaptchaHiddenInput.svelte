<script lang="ts" module>
	export async function promptCaptcha(hcaptcha: VanillaHCaptchaWebComponent) {
		try {
			const { response } = await hcaptcha.executeAsync();
			posthogjs.capture(`hcaptcha:verified`);

			return ok(response);
		} catch (error) {
			console.error("hcaptcha:", error);
			if (typeof error === "string") {
				posthogjs.capture(`hcaptcha:${error}`);

				if (error === "challenge-closed") {
					return err("CAPTCHA_CLOSED");
				}
			}

			toast({
				variant: "destructive",
				title: "Captcha failed, please try again",
				description:
					typeof error === "string"
						? error
						: error && (error instanceof Error || typeof error === "object") && "message" in error
							? (error.message as string)
							: undefined
			});

			return err("CAPTCHA_FAILED", {
				error
			});
		}
	}

	export type HCaptchaHiddenInputProps = { id: string; ref: VanillaHCaptchaWebComponent | null };
</script>

<script lang="ts">
	import type { VanillaHCaptchaWebComponent } from "@hcaptcha/vanilla-hcaptcha";
	import { err, ok } from "@l3dev/result";
	import { toast } from "@versetools/ui";
	import posthogjs from "posthog-js";

	import { PUBLIC_HCAPTCHA_SITEKEY } from "$env/static/public";

	let { id, ref = $bindable() }: HCaptchaHiddenInputProps = $props();
</script>

<svelte:head>
	<script src="https://cdn.jsdelivr.net/npm/@hcaptcha/vanilla-hcaptcha"></script>
</svelte:head>

<h-captcha bind:this={ref} {id} site-key={PUBLIC_HCAPTCHA_SITEKEY} size="invisible" theme="dark"
></h-captcha>
