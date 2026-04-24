<script lang="ts">
	import { Button, Drawer, Input, Label } from "$lib";

	import Preview from "../_components/preview.svelte";

	let open = $state(false);
</script>

<Preview title="Drawer">
	<Button onclick={() => (open = true)}>Open drawer</Button>

	<Drawer.Portal bind:open>
		<Drawer.Overlay />
		<Drawer>
			<Drawer.Header>
				<Drawer.Title>Edit profile</Drawer.Title>
				<Drawer.Description>
					Make changes to your profile here. Click save when you're done.
				</Drawer.Description>
				<Drawer.Close />
			</Drawer.Header>
			<Drawer.Body>
				<div class="flex flex-col gap-1">
					<Label for="name">Name</Label>
					<Input id="name" placeholder="Your name" value="John Doe" />
				</div>
				<div class="flex flex-col gap-1">
					<Label for="email">Email</Label>
					<Input id="email" placeholder="Your email" value="johndoe@example.com" />
				</div>
			</Drawer.Body>
			<Drawer.Footer>
				<div class="flex items-center justify-end gap-2">
					<Button variant="ghost" size="sm" onclick={() => (open = false)}>Cancel</Button>
					<Button size="sm" onclick={() => (open = false)}>Save</Button>
				</div>
			</Drawer.Footer>
		</Drawer>
	</Drawer.Portal>
</Preview>
