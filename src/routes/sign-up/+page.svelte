<script lang="ts" context="module">
    const clientValidate = extend(validate, (input, { error }) => {
        if (input.password !== input.passwordConfirmation) {
            return error('passwordConfirmation', 'confirmed');
        }
    });
</script>

<script lang="ts">
    import { enhance } from '$app/forms';
    import { circInOut } from 'svelte/easing';
    import { fly } from 'svelte/transition';
    import Button from '~/lib/components/Button.svelte';
    import Errors from '~/lib/components/Errors.svelte';
    import Input from '~/lib/components/Input.svelte';
    import Label from '~/lib/components/Label.svelte';
    import Link from '~/lib/components/Link.svelte';
    import LogoType from '~/lib/components/LogoType.svelte';
    import { hasProperty } from '~/lib/utils/commons';
    import { extend, type ValidationResult } from '~/lib/utils/validation';
    import type { ActionData } from './$types';
    import Success from './Success.svelte';
    import { decode, validate } from './utils';
    import { D } from '@mobily/ts-belt';

    const errorMap = {
        root: {
            fetch: 'Could not issue the request',
            404: 'Could not connect to server'
        },
        email: {
            required: 'Enter an email address',
            email: 'Enter a valid email address',
            duplicated_email: 'The email address has already been used'
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
    let validation: ValidationResult | undefined;

    const errors = $derived(form?.errors ?? {}) as Record<string, string[]>;
</script>

<main class="px-8 py-16">
    <div class="w-full mx-auto">
        <LogoType class="h-24 mx-auto" />
        <div class="transition-enforcement overflow-hidden">
            {#if form?.email}
                <div
                    in:fly={{ y: '15%', duration: 800, easing: circInOut }}
                    class="mt-8 mx-auto text-center text-balance prose"
                >
                    <Success email={form.email} />
                </div>
            {:else}
                <div out:fly={{ y: '-10%', duration: 800, easing: circInOut }} class="mt-8">
                    <h1 class="text-center mb-8">Create an account</h1>
                    <p class="text-center text-balance">
                        Fill in the form to create a new account.
                    </p>
                    <hr class="text-base-border/40 max-w-[40ch] mt-2 mb-8 mx-auto" />
                    <form
                        method="post"
                        class="space-y-6 w-full max-w-[40ch] mx-auto"
                        onchange={({ currentTarget }) => {
                            const input = decode(new FormData(currentTarget));
                            validation = clientValidate(input);

                            form = validation.ok
                                ? null
                                : {
                                      errors: D.filterWithKey(
                                          validation.errors,
                                          (k) => hasProperty(input, k) && !!input[k]
                                      ) as typeof validation.errors
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
                        <Errors
                            errors={errors['root']}
                            errorMap={errorMap.root}
                            class="text-center"
                        />
                        <div class="space-y-1">
                            <Label for="email" class="block">Email address</Label>
                            <Input
                                type="email"
                                id="email"
                                name="email"
                                autofocus
                                required
                                aria-invalid={errors['email'] ? true : undefined}
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
                                aria-invalid={errors['password'] ? true : undefined}
                            />
                            <Errors errors={errors['password']} errorMap={errorMap.password} />
                        </div>
                        <div class="space-y-1">
                            <Label for="passwordConfirmation" class="block"
                                >Password confirmation</Label
                            >
                            <Input
                                type="password"
                                id="passwordConfirmation"
                                name="passwordConfirmation"
                                required
                                aria-invalid={errors['passwordConfirmation'] ? true : undefined}
                            />
                            <Errors
                                errors={errors['passwordConfirmation']}
                                errorMap={errorMap.passwordConfirmation}
                            />
                        </div>
                        <Button disabled={status === 'submitting'}>Sign up</Button>
                    </form>
                    <div class="mt-8 space-y-4 text-center w-fit mx-auto">
                        <p>
                            <small>
                                By signing up, you agree to our <Link href="#"
                                    >Terms of Service</Link
                                ><br />
                                and <Link href="#">Data Processing Agreement</Link>.
                            </small>
                        </p>
                        <hr class="w-full text-base-border mx-auto" />
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
