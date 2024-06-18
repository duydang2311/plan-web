<script lang="ts" context="module">
	const clientValidate = extend(validate, (input, { error }) => {
		if (input.password !== input.passwordConfirmation) {
			error('password', 'confirmed');
			error('passwordConfirmation', 'confirmed');
		}
	});
</script>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { circInOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';
	import Button from '~/lib/components/Button.svelte';
	import Errors from '~/lib/components/Errors.svelte';
	import Input from '~/lib/components/Input.svelte';
	import Label from '~/lib/components/Label.svelte';
	import Link from '~/lib/components/Link.svelte';
	import LogoType from '~/lib/components/LogoType.svelte';
	import type { ActionData } from './$types';
	import Success from './Success.svelte';
	import { validate } from './utils';
	import { extend } from '~/lib/utils/validation';

	const errorMap = {
		root: {
			unknown: 'An unknown error has occurred on server',
			404: 'Could not connect to server'
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
	const errors = $derived(form?.errors ?? {}) as Record<string, string[]>;
</script>

<main class="flex justify-center p-8 items-center mt-8">
	<div class="w-full max-w-[70ch]">
		<LogoType class="h-24 mx-auto" />
		<div class="transition-enforcement">
			{#if form?.success}
				<div
					transition:scale={{ start: 1.04, duration: 600, easing: circInOut }}
					class="mt-8 text-center text-balance prose"
				>
					<Success email={form.email} />
				</div>
			{:else}
				<div transition:scale={{ start: 0.98, easing: circInOut }} class="mt-8">
					<h1 class="text-center mb-8">Create an account</h1>
					<p class="text-center text-balance">Fill in the form to create a new account.</p>
					<hr class="text-base-border/40 max-w-[40ch] mt-2 mb-8 mx-auto" />
					<form
						method="post"
						class="space-y-6 w-full max-w-[40ch] mx-auto"
						use:enhance={(e) => {
							const validated = clientValidate(Object.fromEntries(e.formData.entries()));
							if (!validated.ok) {
								form = { errors: validated.errors };
								e.cancel();
								return;
							}

							form = null;
							status = 'submitting';
							return async ({ update }) => {
								status = null;
								await update();
							};
						}}
					>
						<Errors errors={errors['root']} errorMap={errorMap.root} class="text-center" />
						<div class="space-y-1">
							<Label for="email" class="block">Email address</Label>
							<Input
								type="email"
								id="email"
								name="email"
								autofocus
								required
								aria-invalid={!!errors['email']}
							/>
							<Errors errors={errors['email']} errorMap={errorMap.email} />
						</div>
						<div class="space-y-1">
							<Label for="password" class="block">Password</Label>
							<Input
								type="password"
								id="password"
								name="password"
								required
								aria-invalid={!!errors['password']}
							/>
							<Errors errors={errors['password']} errorMap={errorMap.password} />
						</div>
						<div class="space-y-1">
							<Label for="passwordConfirmation" class="block">Password confirmation</Label>
							<Input
								type="password"
								id="passwordConfirmation"
								name="passwordConfirmation"
								required
								aria-invalid={!!errors['passwordConfirmation']}
							/>
							<Errors
								errors={errors['passwordConfirmation']}
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
						<p>
							<small>
								Already have an account?
								<Link href="/login">Login</Link>.
							</small>
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</main>
