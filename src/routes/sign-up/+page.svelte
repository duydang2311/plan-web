<script lang="ts" module>
    const clientValidate = extend(validate, (input, { error }) => {
        if (input.password !== input.passwordConfirmation) {
            return error('passwordConfirmation', 'confirmed');
        }
    });
</script>

<script lang="ts">
    import { enhance } from '$app/forms';
    import { D } from '@mobily/ts-belt';
    import { circInOut } from 'svelte/easing';
    import { fly } from 'svelte/transition';
    import Button from '~/lib/components/Button.svelte';
    import Errors from '~/lib/components/Errors.svelte';
    import Input from '~/lib/components/Input.svelte';
    import Label from '~/lib/components/Label.svelte';
    import LandingLayout from '~/lib/components/layouts/LandingLayout.svelte';
    import Link from '~/lib/components/Link.svelte';
    import { hasProperty } from '~/lib/utils/commons';
    import { extend, type ValidationResult } from '~/lib/utils/validation';
    import type { ActionData } from './$types';
    import Success from './Success.svelte';
    import { decode, validate } from './utils';

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

<LandingLayout>
    <main class="mt-16 max-w-paragraph-lg mx-auto p-8">
            <div class="transition-enforcement overflow-hidden">
                {#if form?.email}
                    <div
                        in:fly={{ y: '15%', duration: 800, easing: circInOut }}
                        class="prose mx-auto mt-8 text-balance text-center"
                    >
                        <Success email={form.email} />
                    </div>
                {:else}
                    <div out:fly={{ y: '-10%', duration: 800, easing: circInOut }}>
                        <h1 class="capitalize font-bold">Sign up</h1>
                        <p class="c-text-secondary mb-8 text-pretty">
                            Start managing projects smarter — collaborate, track, and achieve more.
                        </p>
                        <form
                            method="post"
                            class="w-full space-y-6"
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
                        <div class="mx-auto mt-8 w-fit space-y-4 text-center">
                            <p>
                                <small>
                                    By signing up, you agree to our <Link href="#"
                                        >Terms of Service</Link
                                    ><br />
                                    and <Link href="#">Data Processing Agreement</Link>.
                                </small>
                            </p>
                            <hr class="text-base-border-2 mx-auto w-full" />
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
    </main>
</LandingLayout>
