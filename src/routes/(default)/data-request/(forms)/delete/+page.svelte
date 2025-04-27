<script lang="ts">
	import {
		toast,
		Button,
		Card,
		Form,
		Input,
		RadioInput,
		Textarea,
		Label,
		FileInput
	} from "@versetools/ui";
	import { ArrowLeftIcon } from "lucide-svelte";
	import { superForm } from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";

	import Meta from "$lib/seo/meta.svelte";

	import type { PageData } from "./$types";
	import { DeletionRequestSchema } from "./schema";

	let { data }: { data: PageData } = $props();

	const form = superForm(data.form, {
		validators: zodClient(DeletionRequestSchema),
		dataType: "json",
		onResult(event) {
			if (event.result.type === "success") {
				toast({
					type: "assertive",
					title: "Deletion request submitted!",
					description: "You'll receive an email shortly to verify the request.",
					delay: 10000
				});
			}
		}
	});

	const { form: formData } = form;

	let behalfOfValue = $state("Myself");
	let onBehalfOfUser = $derived(behalfOfValue !== "Myself");

	$effect(() => {
		formData.update((d) => ({
			...d,
			thirdParty: onBehalfOfUser ? { firstName: "", lastName: "", email: "" } : null
		}));
	});
</script>

<Meta title="Deletion Request" />

<Card size="xl">
	<Card.Header>
		<a href="/data-request" class="mb-4 flex items-center text-sm hover:underline">
			<ArrowLeftIcon class="mr-2 size-4" />
			Back to Data Request Center
		</a>
		<Card.Title class="text-2xl">Deletion Request</Card.Title>
		<Card.Description>
			<span class="text-text font-bold">NOTE:</span> The processing of this request will cause all accounts
			containing the provided email address to be deleted.
		</Card.Description>
	</Card.Header>
	<Card.Body>
		<div class="mb-4 flex flex-col gap-1">
			<span class="font-medium">I'm making this request on behalf of:</span>
			<RadioInput
				options={["Myself", "Someone else - I'm an authorized agent"]}
				bind:value={behalfOfValue}
			/>
		</div>
		<Form {form}>
			{#if $formData.thirdParty}
				<Form.Field {form} name="thirdParty.firstName">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Your first name</Form.Label>
							<Input
								{...props}
								placeholder="First name"
								bind:value={$formData.thirdParty!.firstName}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="thirdParty.lastName">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Your last name</Form.Label>
							<Input
								{...props}
								placeholder="Last name"
								bind:value={$formData.thirdParty!.lastName}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="thirdParty.email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Your email</Form.Label>
							<Input
								{...props}
								type="email"
								placeholder="Email"
								bind:value={$formData.thirdParty!.email}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			{/if}
			<Form.Field {form} name="dataSubject.firstName">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{onBehalfOfUser ? "Data subject's" : "Your"} first name</Form.Label>
						<Input
							{...props}
							placeholder="First name"
							bind:value={$formData.dataSubject.firstName}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="dataSubject.lastName">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{onBehalfOfUser ? "Data subject's" : "Your"} last name</Form.Label>
						<Input {...props} placeholder="Last name" bind:value={$formData.dataSubject.lastName} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="dataSubject.email">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{onBehalfOfUser ? "Data subject's" : "Your"} email</Form.Label>
						<Input
							{...props}
							type="email"
							placeholder="Email"
							bind:value={$formData.dataSubject.email}
						/>
					{/snippet}
				</Form.Control>
				<Form.Hint
					>This must match an email address used in our products for us to successfully complete
					this request.</Form.Hint
				>
				<Form.FieldErrors />
			</Form.Field>
			<div class="flex flex-col gap-1">
				{#if $formData.thirdParty}
					<Label for="evidence-of-consent">Evidence of consent</Label>
					<FileInput
						id="evidence-of-consent"
						accept={[
							"image/*",
							"application/pdf",
							"application/msword",
							"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
						]}
						hide-dropzone="when-full"
					/>
					<span class="text-text-80 text-xs">
						You must provide evidence that you have consent from the data subject to submit this
						request on their behalf.
					</span>
				{/if}
			</div>
			<Form.Field {form} name="additionalComments">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Additional comments</Form.Label>
						<Textarea
							{...props}
							placeholder="Any additional information"
							bind:value={$formData.additionalComments}
						/>
					{/snippet}
				</Form.Control>
				<Form.Hint
					>Provide us with any additional information or concerns regarding your request. Please
					avoid including any sensitive information.</Form.Hint
				>
				<Form.FieldErrors />
			</Form.Field>
			<div class="flex gap-4">
				<Button type="submit">Submit Request</Button>
				<Button href="/data-request" variant="ghost">Cancel</Button>
			</div>
		</Form>
	</Card.Body>
</Card>
