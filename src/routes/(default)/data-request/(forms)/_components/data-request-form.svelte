<script lang="ts" module>
	type DataRequestSchemaType = typeof DataRequestSchema;
</script>

<script lang="ts" generics="TSchema extends DataRequestSchemaType">
	import {
		toast,
		Button,
		Form,
		Input,
		RadioInput,
		Textarea,
		FileInput,
		Label,
		EditableFile,
		progressToast
	} from "@versetools/ui";
	import type { Snippet } from "svelte";
	import { superForm, type SuperForm, type SuperValidated } from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";
	import type { z } from "zod";

	import { createUploader } from "$lib/uploadthing";

	import type { DataRequestSchema } from "../schema";

	let {
		name,
		data,
		schema,
		children
	}: {
		name: string;
		data: SuperValidated<z.infer<TSchema>>;
		schema: TSchema;
		children?: Snippet<[{ form: SuperForm<z.infer<TSchema>, any> }]>;
	} = $props();

	let evidenceFiles = $state<EditableFile[]>([]);

	let uploadToast: ReturnType<typeof progressToast> | null = null;
	function notifyDone() {
		if (uploadToast) {
			uploadToast.complete();
			uploadToast = null;
		}

		toast({
			type: "assertive",
			title: `${name} request submitted!`,
			description: "You'll receive an email shortly to verify the request.",
			delay: 10000
		});
	}

	const evidenceUploader = createUploader("dataRequestEvidence", {
		onUploadBegin(fileName) {
			if (uploadToast) {
				uploadToast.toast.removeSelf();
				uploadToast = null;
			}

			uploadToast = progressToast({
				title: "Uploading evidence...",
				description: fileName
			});
		},
		onUploadProgress(p) {
			if (uploadToast) {
				console.log(p);
				uploadToast.update(p);
			}
		},
		onUploadError(e, rejected) {
			console.error(e, rejected);
			toast({
				type: "assertive",
				title: "Failed to upload evidence",
				description:
					"Failed to upload evidence of consent, you'll receive an email shortly to verify your email and retry.",
				delay: 10000
			});
		},
		onClientUploadComplete() {
			notifyDone();
		}
	});

	let behalfOfValue = $state("Myself");
	let onBehalfOfUser = $derived(behalfOfValue !== "Myself");

	const form = superForm(data, {
		validators: zodClient(schema),
		dataType: "json",
		async onResult(event) {
			if (event.result.type === "success") {
				if (onBehalfOfUser) {
					await evidenceUploader.startUpload(
						evidenceFiles.map((f) => f.object),
						{
							requestId: event.result.data!.requestId
						}
					);
				} else {
					notifyDone();
				}

				form.reset();
			} else if (event.result.type === "failure" && event.result.status === 409) {
				toast({
					type: "assertive",
					title: `You already have an active ${name} request`,
					description: "Please wait for your request to be processed before submitting a new one",
					delay: 10000
				});
			} else if (event.result.type === "failure") {
				toast({
					type: "assertive",
					title: "Failed to submit request, please try again later",
					description: event.result.data?.type
				});
			} else if (event.result.type === "error") {
				console.error(event.result.error);
				toast({
					type: "assertive",
					title: "Error submitting request, please try again later"
				});
			}
		}
	});

	const { form: formData } = form;

	const formAs = form as SuperForm<z.infer<typeof DataRequestSchema>, any>;

	$effect(() => {
		formData.update((d) => ({
			...d,
			thirdParty: onBehalfOfUser ? { firstName: "", lastName: "", email: "" } : null
		}));
	});
</script>

<div class="mb-4 flex flex-col gap-1">
	<span class="font-medium">I'm making this request on behalf of:</span>
	<RadioInput
		options={["Myself", "Someone else - I'm an authorized agent"]}
		bind:value={behalfOfValue}
	/>
</div>
<Form {form}>
	{#if $formData.thirdParty}
		<Form.Field form={formAs} name="thirdParty.firstName">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Your first name</Form.Label>
					<Input {...props} placeholder="First name" bind:value={$formData.thirdParty!.firstName} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field form={formAs} name="thirdParty.lastName">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Your last name</Form.Label>
					<Input {...props} placeholder="Last name" bind:value={$formData.thirdParty!.lastName} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field form={formAs} name="thirdParty.email">
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
	<Form.Field form={formAs} name="dataSubject.firstName">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{onBehalfOfUser ? "Data subject's" : "Your"} first name</Form.Label>
				<Input {...props} placeholder="First name" bind:value={$formData.dataSubject.firstName} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field form={formAs} name="dataSubject.lastName">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{onBehalfOfUser ? "Data subject's" : "Your"} last name</Form.Label>
				<Input {...props} placeholder="Last name" bind:value={$formData.dataSubject.lastName} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field form={formAs} name="dataSubject.email">
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
			>This must match an email address used in our products for us to successfully complete this
			request.</Form.Hint
		>
		<Form.FieldErrors />
	</Form.Field>
	{@render children?.({ form })}
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
				max-size={4 * 1024 * 1024}
				hide-dropzone="when-full"
				bind:value={evidenceFiles}
			/>
			<span class="text-text-80 text-xs">
				You must provide evidence that you have consent from the data subject to submit this request
				on their behalf.
			</span>
		{/if}
	</div>
	<Form.Field form={formAs} name="additionalComments">
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
			>Provide us with any additional information or concerns regarding your request. Please avoid
			including any sensitive information.</Form.Hint
		>
		<Form.FieldErrors />
	</Form.Field>
	<div class="flex gap-4">
		<Button
			onclick={async () => {
				const { valid, data } = await form.validateForm({
					update: true
				});
				if (!valid) return;

				if (data.thirdParty && !evidenceFiles.length) {
					toast({
						type: "assertive",
						title: "Evidence of consent is required",
						description: "Please upload evidence of consent from the data subject"
					});
					return;
				}

				form.submit();
			}}>Submit Request</Button
		>
		<Button href="/data-request" variant="ghost">Cancel</Button>
	</div>
</Form>
