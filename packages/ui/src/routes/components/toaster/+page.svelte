<script lang="ts">
	import { Button, toast, Toaster, type ToastConfig } from "$lib";

	import Preview from "../_components/preview.svelte";

	const randomToasts: ToastConfig[] = [
		{
			title: "Default",
			description: "Just a regular ol' toast.",
			variant: "default"
		},
		{
			title: "Success",
			description: "Your changes have been saved.",
			variant: "success"
		},
		{
			title: "Error",
			description: "Something went wrong!",
			variant: "destructive"
		},
		{
			title: "Permanent Toast",
			description: "This will never close automatically.",
			variant: "default",
			delay: 0
		},
		{
			title: "No close button",
			description: "There's no close button!",
			variant: "default",
			hideClose: true
		},
		{
			title: "Default toast with a very long title",
			description: "Just a regular ol' toast. with a very long title.",
			variant: "default"
		},
		{
			title: "Successfully saved all of your changes, yey!",
			description: "Your changes have been saved.",
			variant: "success"
		},
		{
			title: "Failed to do something, please try again",
			description: "Something went wrong!",
			variant: "destructive"
		}
	];

	function randomToast() {
		const randomToast = randomToasts[Math.floor(Math.random() * randomToasts.length)]!;
		console.log("Mmmm toast", randomToast);
		toast(randomToast);
	}
</script>

<Preview title="Toaster">
	<Button onclick={() => randomToast()}>Pop toast</Button>
	<Toaster />
</Preview>
