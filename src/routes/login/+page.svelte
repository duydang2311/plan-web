<script lang="ts">
    import { enhance } from '$app/forms';
    import Button from '~/lib/components/Button.svelte';
    import Errors from '~/lib/components/Errors.svelte';
    import { IconGoogle } from '~/lib/components/icons';
    import Input from '~/lib/components/Input.svelte';
    import Label from '~/lib/components/Label.svelte';
    import LandingLayout from '~/lib/components/layouts/LandingLayout.svelte';
    import Link from '~/lib/components/Link.svelte';
    import { createForm, formValidator } from '~/lib/utils/form.svelte';
    import type { ActionData, PageData } from './$types';
    import { validate } from './utils';

    const errorMap = {
        root: {
            fetch: 'Could not issue the request',
            500: 'An unknown error has occurred on server',
            404: 'Could not connect to server'
        },
        email: {
            required: 'Enter an email address',
            email: 'Enter a valid email address',
            email_not_found: 'The email address has not been registered',
            invalid_credentials: 'The email address or password could not be verified'
        },
        password: {
            required: 'Enter a password',
            string: 'Enter a password',
            invalid_credentials: 'The email address or password could not be verified'
        }
    };

    let { data, form }: { data: PageData; form: ActionData } = $props();
    let status = $state<'submitting' | null>(null);
    const helperForm = createForm({
        validator: formValidator(validate)
    });
    const fields = {
        email: helperForm.createField({ name: 'email' }),
        password: helperForm.createField({ name: 'password' })
    };
    const rootErrors = $derived(form?.errors.root);

    $effect(() => {
        if (form) {
            helperForm.setErrors(form.errors);
        }
    });
</script>

<LandingLayout>
    <main class="max-w-paragraph-lg mx-auto mt-16 p-8">
        <h1 class="font-bold capitalize">Sign in</h1>
        <p class="c-text-secondary">
            Ready to dive in? Let’s get things done with <strong>konekt</strong>.
        </p>
        {#if data.flashVerified}
            <div class="bg-positive-1/10 border-positive-1/10 mt-4 rounded border p-1">
                <span class="text-positive-1 c-text-secondary">
                    Your email address has been verified successfully. You can now sign in.
                </span>
            </div>
        {/if}
        <div class="mt-8">
            <form
                method="post"
                action="?/sign-in"
                class="w-full space-y-6"
                use:helperForm
                use:enhance={(e) => {
                    helperForm.validate();
                    if (!helperForm.isValid()) {
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
                <Errors errors={rootErrors} errorMap={errorMap.root} class="text-center" />
                <div class="space-y-1">
                    <Label for="email" class="block">Email address</Label>
                    <Input
                        useField={fields.email}
                        type="email"
                        id="email"
                        name={fields.email.state.name}
                        bind:value={fields.email.state.value}
                        autofocus
                        required
                    />
                    <Errors errors={fields.email.state.errors} errorMap={errorMap.email} />
                </div>
                <div class="space-y-1">
                    <div class="flex flex-wrap justify-between gap-2">
                        <Label for="password" class="block">Password</Label>
                        <Link
                            href="https://ark-ui.com/react/docs/components/clipboard"
                            class="ml-auto text-sm"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <Input
                        useField={fields.password}
                        type="password"
                        id="password"
                        name={fields.password.state.name}
                        bind:value={fields.password.state.value}
                        autofocus
                        required
                    />
                    <Errors errors={fields.password.state.errors} errorMap={errorMap.password} />
                </div>
                <Button disabled={status === 'submitting'}>Sign in</Button>
            </form>
            <form method="post" action="?/google-sign-in" class="mt-8">
                <Button
                    type="submit"
                    variant="base"
                    outline
                    class="flex items-center justify-center gap-4"
                >
                    <IconGoogle />
                    Sign in with Google
                </Button>
            </form>
        </div>
        <div class="mx-auto mt-8 w-fit space-y-4 text-center">
            <hr class="text-base-border-2 w-full" />
            <p>
                <small>
                    New user?
                    <Link href="/sign-up">Sign up</Link>.
                </small>
            </p>
        </div>
    </main>
</LandingLayout>
