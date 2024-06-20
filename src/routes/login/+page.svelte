<script lang="ts">
	import { enhance } from '$app/forms';
	import { Record } from 'effect';
	import Button from '~/lib/components/Button.svelte';
	import Errors from '~/lib/components/Errors.svelte';
	import Input from '~/lib/components/Input.svelte';
	import Label from '~/lib/components/Label.svelte';
	import Link from '~/lib/components/Link.svelte';
	import LogoType from '~/lib/components/LogoType.svelte';
	import { hasProperty } from '~/lib/utils/commons';
	import type { ValidationResult } from '~/lib/utils/validation';
	import type { ActionData } from './$types';
	import { decode, validate } from './utils';

	const errorMap = {
		root: {
			unknown: 'An unknown error has occurred on server',
			404: 'Could not connect to server'
		},
		email: {
			required: 'Enter an email address',
			email: 'Enter a valid email address',
			email_not_found: 'The email address has not been registered'
		},
		password: {
			required: 'Enter a password',
			string: 'Enter a password',
			invalid_credentials: 'The email address or password could not be verified'
		}
	};

	let { form }: { form: ActionData } = $props();
	let fields = $state({
		email: '',
		password: ''
	});
	let status = $state<'submitting' | null>(null);
	let validation: ValidationResult | undefined;

	const errors = $derived(form?.errors ?? {}) as Record<string, string[]>;
</script>

<main class="px-8 py-16">
	<div class="w-full mx-auto">
		<LogoType class="h-24 mx-auto" />
		<h1 class="text-center mb-8 mt-8">Sign in</h1>
		<form
			method="post"
			class="space-y-6 w-full max-w-[40ch] mx-auto"
			onchange={({ currentTarget }) => {
				const input = decode(new FormData(currentTarget));
				validation = validate(input);
				form = validation.ok
					? null
					: {
							errors: Record.filter(
								validation.errors,
								(_, k) => hasProperty(input, k) && !!input[k]
							)
						};
			}}
			use:enhance={(e) => {
				if (!validation?.ok) {
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
			<Errors errors={errors['root']} errorMap={errorMap.root} class="text-center" />
			<div class="space-y-1">
				<Label for="email" class="block">Email address</Label>
				<Input
					type="email"
					id="email"
					name="email"
					autofocus
					required
					aria-invalid={errors['email']?.filter((x) => x !== 'invalid_credentials').length
						? 'true'
						: undefined}
					bind:value={fields.email}
				/>
				<Errors
					errors={errors['email']?.filter((x) => x !== 'invalid_credentials')}
					errorMap={errorMap.email}
				/>
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
					autofocus
					required
					aria-invalid={errors['password'] ? 'true' : undefined}
					bind:value={fields.password}
				/>
				<Errors errors={errors['password']} errorMap={errorMap.password} />
			</div>
			<Button disabled={status === 'submitting'}>Sign in</Button>
		</form>
		<div class="mt-8 space-y-4 text-center w-fit mx-auto">
			<hr class="w-full text-base-border" />
			<p>
				<small>
					New user?
					<Link href="/sign-up">Sign up</Link>.
				</small>
			</p>
		</div>
	</div>
</main>
