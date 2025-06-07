<script lang="ts">
	import { Card } from "@versetools/ui";

	import Loader from "$lib/components/loader.svelte";
	import Meta from "$lib/seo/meta.svelte";

	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
</script>

<Meta title="Request Verification" />

<Card size="xl" class="text-center" inner-class="py-24">
	{#await data.tokenResult}
		<Card.Body class="items-center justify-center">
			<Loader />
			<p class="text-text-80 text-sm">Verifying your email...</p>
		</Card.Body>
	{:then result}
		{#if result.ok}
			{#if result.value}
				<Card.Header>
					<Card.Title>Thank you for verifying your email!</Card.Title>
					<Card.Description>
						We will notify you when we need more information or have processed your request.
					</Card.Description>
				</Card.Header>
				<Card.Body>
					<span class="text-sm">You can safely close this tab.</span>
				</Card.Body>
			{:else}
				<Card.Header>
					<Card.Title>Invalid verification token</Card.Title>
					<Card.Description>
						The token in the request is invalid, your email may already be verified.
					</Card.Description>
				</Card.Header>
				<Card.Body>
					<span class="text-sm">You can safely close this tab.</span>
				</Card.Body>
			{/if}
		{:else}
			<Card.Header>
				<Card.Title>
					{#if result.type === "MISSING_TOKEN"}
						Token not provided in request
					{:else}
						Internal server error
					{/if}
				</Card.Title>
				<Card.Description>Please close this tab and try again</Card.Description>
			</Card.Header>
			<Card.Body>
				<span class="text-text-60 text-xs">err: {result.type}</span>
			</Card.Body>
		{/if}
	{/await}
</Card>
