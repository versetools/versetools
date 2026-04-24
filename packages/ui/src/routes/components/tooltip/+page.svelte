<script lang="ts">
	import CircleQuestionMarkIcon from "@lucide/svelte/icons/circle-question-mark";

	import { Tooltip } from "$lib";

	import Preview from "../_components/preview.svelte";
</script>

<Preview title="Button">
	<Tooltip>
		{#snippet trigger(props)}
			<div {...props}>
				<CircleQuestionMarkIcon />
			</div>
		{/snippet}
		Hello world
	</Tooltip>
</Preview>
