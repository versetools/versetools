<script lang="ts">
	import SearchIcon from "@lucide/svelte/icons/search";

	import { Input } from "$lib";

	import Preview from "../_components/preview.svelte";
</script>

<Preview title="Input">
	<Input placeholder="Write something..." />
	<Input placeholder="Search" Icon={SearchIcon} />
	<Input readonly value="John Doe" />
	<Input disabled value="John Doe" />

	<Input variant="destructive" placeholder="Write something..." />
	<Input variant="destructive" readonly value="John Doe" />
	<Input variant="destructive" disabled value="John Doe" />
</Preview>
