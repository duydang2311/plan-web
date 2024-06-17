<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '~/lib/components/Button.svelte';
	import Errors from '~/lib/components/Errors.svelte';
	import Input from '~/lib/components/Input.svelte';
	import Label from '~/lib/components/Label.svelte';
	import Link from '~/lib/components/Link.svelte';
	import LogoType from '~/lib/components/LogoType.svelte';
	import type { ActionData } from './$types';
	import { validate } from './utils';

	const errorMap = {
		root: {
			unknown: 'An unknown error has occurred on server'
		},
		email: {
			required: 'Enter an email address',
			email: 'Enter a valid email address'
		},
		password: {
			required: 'Enter a password',
			minLength: 'Enter a password with 7 or more characters long',
			confirmed: 'Enter the password confirmation correctly'
		},
		passwordConfirmation: {
			required: 'Enter the password again',
			confirmed: 'Enter the password confirmation correctly'
		}
	};

	let { form }: { form: ActionData } = $props();
	let status = $state<'submitting' | null>(null);
</script>

<main class="w-full flex flex-col items-center p-8 mt-20">
	<div class="w-full max-w-[40ch]">
		<LogoType class="h-24 mx-auto" />
		<p class="text-center text-balance mt-8">Fill in the form below to create an account.</p>
		<hr class="text-base-border/40 w-full max-w-[40ch] mt-2 mb-8" />
		<form
			method="post"
			class="space-y-6 w-full"
			use:enhance={(e) => {
				form = null;
				const validated = validate(Object.fromEntries(e.formData.entries()));
				if (!validated.ok) {
					form = { errors: validated.errors };
					e.cancel();
					return;
				}
				status = 'submitting';
				return async ({ update }) => {
					status = null;
					await update();
				};
			}}
		>
			<Errors errors={form?.errors['root']} errorMap={errorMap.root} class="text-center" />
			<div class="space-y-1">
				<Label for="email" class="block">Email address</Label>
				<Input
					type="email"
					id="email"
					name="email"
					autofocus
					required
					aria-invalid={!!form?.errors['email']}
				/>
				<Errors errors={form?.errors['email']} errorMap={errorMap.email} />
			</div>
			<div class="space-y-1">
				<Label for="password" class="block">Password</Label>
				<Input
					type="password"
					id="password"
					name="password"
					required
					aria-invalid={!!form?.errors['password']}
				/>
				<Errors errors={form?.errors['password']} errorMap={errorMap.password} />
			</div>
			<div class="space-y-1">
				<Label for="passwordConfirmation" class="block">Password confirmation</Label>
				<Input
					type="password"
					id="passwordConfirmation"
					name="passwordConfirmation"
					required
					aria-invalid={!!form?.errors['passwordConfirmation']}
				/>
				<Errors
					errors={form?.errors['passwordConfirmation']}
					errorMap={errorMap.passwordConfirmation}
				/>
			</div>
			<Button disabled={status === 'submitting'}>
				{#if status === 'submitting'}
					Loading...
				{:else}
					Sign up
				{/if}
			</Button>
		</form>
		<div class="mt-8 space-y-4 text-center">
			<p>
				<small>
					By signing up, you agree to our <Link href="#">Terms of Service</Link><br />
					and <Link href="#">Data Processing Agreement</Link>.
				</small>
			</p>
			<hr class="w-4 text-base-border mx-auto" />
			<div>
				<small>
					Already have an account?
					<Link href="/login">Login</Link>.
				</small>
			</div>
		</div>
	</div>
</main>
