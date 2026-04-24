<script lang="ts">
	import { Button, Dialog, Input, Label } from "$lib";

	import Preview from "../_components/preview.svelte";

	let open = $state(false);
</script>

<Preview title="Dialog">
	<Button onclick={() => (open = true)}>Open dialog</Button>

	<Dialog.Portal bind:open>
		<Dialog.Overlay />
		<Dialog>
			<Dialog.Header>
				<Dialog.Title>Edit profile</Dialog.Title>
				<Dialog.Description>
					Make changes to your profile here. Click save when you're done.
				</Dialog.Description>
				<Dialog.Close />
			</Dialog.Header>
			<Dialog.Body>
				<div class="flex flex-col gap-1">
					<Label for="name">Name</Label>
					<Input id="name" placeholder="Your name" value="John Doe" />
				</div>
				<div class="flex flex-col gap-1">
					<Label for="email">Email</Label>
					<Input id="email" placeholder="Your email" value="johndoe@example.com" />
				</div>
				<div class="flex items-center justify-end gap-2">
					<Button variant="ghost" size="sm" onclick={() => (open = false)}>Cancel</Button>
					<Button size="sm" onclick={() => (open = false)}>Save</Button>
				</div>
			</Dialog.Body>
		</Dialog>
	</Dialog.Portal>
</Preview>
