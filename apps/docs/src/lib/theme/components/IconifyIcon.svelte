<script lang="ts" module>
	export type IconifyIconProps = {
		collection: string;
		name: string;
		[key: string]: any;
	};
</script>

<script lang="ts">
	const { collection, name, ..._rest }: IconifyIconProps = $props();
</script>

<div class="i-{collection}-{name}"></div>
