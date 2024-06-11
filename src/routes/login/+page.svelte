<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import Button from '~/lib/components/Button.svelte';
	import Errors from '~/lib/components/Errors.svelte';
	import Input from '~/lib/components/Input.svelte';
	import Label from '~/lib/components/Label.svelte';
	import Link from '~/lib/components/Link.svelte';
	import Logo from '~/lib/components/Logo.svelte';
	import type { ActionData, PageData } from './$types';

	const { data, form: action }: { data: PageData; form: ActionData } = $props();
	const { form, enhance, errors, constraints } = superForm(data.form);
	const rootErrors = $derived(action?.errors);
</script>

<main class="w-full flex flex-col items-center p-8 mt-24">
	<Logo class="size-24 mb-4 text-gray-200" />
	<h1 class="text-center text-balance text-gray-500 mb-8">Sign in to your account</h1>
	<form method="post" class="space-y-8 w-full max-w-[40ch]" use:enhance>
		<Errors errors={rootErrors} />
		<div class="space-y-1">
			<Label for="email" class="block">Email address</Label>
			<Input
				type="email"
				id="email"
				name="email"
				autofocus
				aria-invalid={$errors.email ? 'true' : undefined}
				bind:value={$form.email}
				{...$constraints.email}
			/>
			<Errors errors={$errors.email} />
		</div>
		<div class="space-y-1">
			<div class="flex justify-between flex-wrap gap-2">
				<Label for="password" class="block">Password</Label>
				<Link href="https://ark-ui.com/react/docs/components/clipboard" class="ml-auto text-sm">
					Forgot password?
				</Link>
			</div>
			<Input
				type="password"
				id="password"
				name="password"
				aria-invalid={$errors.password ? 'true' : undefined}
				bind:value={$form.password}
				{...$constraints.password}
			/>
			<Errors errors={$errors.password} />
		</div>
		<Button>Login</Button>
	</form>
</main>
