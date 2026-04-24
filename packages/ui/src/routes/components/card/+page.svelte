<script lang="ts">
	import { Card } from "$lib";

	import Preview from "../_components/preview.svelte";
</script>

<Preview title="Card">
	<Card>
		<Card.Header>
			<Card.Title>This is a card</Card.Title>
			<Card.Description>This is a description</Card.Description>
		</Card.Header>
		<Card.Body>
			<span>This is some content</span>
		</Card.Body>
	</Card>
	<Card variant="secondary">
		<Card.Header>
			<Card.Title>This is a card</Card.Title>
			<Card.Description>This is a description</Card.Description>
		</Card.Header>
		<Card.Body>
			<span>This is some content</span>
		</Card.Body>
	</Card>
	<Card variant="ghost">
		<Card.Header>
			<Card.Title>This is a card</Card.Title>
			<Card.Description>This is a description</Card.Description>
		</Card.Header>
		<Card.Body>
			<span>This is some content</span>
		</Card.Body>
	</Card>
	<Card variant="destructive">
		<Card.Header>
			<Card.Title>This is a card</Card.Title>
			<Card.Description>This is a description</Card.Description>
		</Card.Header>
		<Card.Body>
			<span>This is some content</span>
		</Card.Body>
	</Card>

	<Card as="button">
		<Card.Header>
			<Card.Title>This is a button</Card.Title>
			<Card.Description>This is a description</Card.Description>
		</Card.Header>
		<Card.Body>
			<span>This is some content</span>
		</Card.Body>
	</Card>
	<Card as="button" variant="secondary">
		<Card.Header>
			<Card.Title>This is a button</Card.Title>
			<Card.Description>This is a description</Card.Description>
		</Card.Header>
		<Card.Body>
			<span>This is some content</span>
		</Card.Body>
	</Card>
	<Card as="button" variant="ghost">
		<Card.Header>
			<Card.Title>This is a button</Card.Title>
			<Card.Description>This is a description</Card.Description>
		</Card.Header>
		<Card.Body>
			<span>This is some content</span>
		</Card.Body>
	</Card>
	<Card as="button" variant="destructive">
		<Card.Header>
			<Card.Title>This is a button</Card.Title>
			<Card.Description>This is a description</Card.Description>
		</Card.Header>
		<Card.Body>
			<span>This is some content</span>
		</Card.Body>
	</Card>
</Preview>
