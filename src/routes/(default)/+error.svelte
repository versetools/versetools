<script lang="ts">
	import { Button, Card } from "@versetools/ui";

	import { page } from "$app/state";
	import Meta from "$lib/seo/meta.svelte";
</script>

{#if page.status === 404}
	<Meta title="404 - Not Found" />

	<Card
		class="mx-auto mt-24 w-full max-w-xl"
		inner-class="items-center gap-6 px-4 py-6 text-center"
		corners="large"
	>
		<h1 class="my-4 text-5xl font-semibold sm:text-6xl">404</h1>
		<p class="text-sm text-pretty">
			The page you are looking for could not be found or no longer exists.
		</p>
		<Button href="/">Go to home</Button>
	</Card>
{:else}
	<Meta title="{page.status} - Unexpected Error" />

	<Card
		class="mx-auto mt-24 w-full max-w-xl"
		inner-class="items-center gap-6 px-4 py-6 text-center"
		corners="large"
	>
		<h1 class="my-4 text-4xl font-semibold">Unexpected Error</h1>
		<p class="text-sm text-pretty">
			An unexpected error has occurred, please try again. If the problem persists, please contact
			our support.
		</p>
		<Button href="/">Go to home</Button>
		<span class="text-text-60 text-xs">{page.status} - {page.error?.message}</span>
	</Card>
{/if}
