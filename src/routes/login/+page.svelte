<script lang="ts">
    import { enhance } from '$app/forms';
    import Button from '~/lib/components/Button.svelte';
    import Errors from '~/lib/components/Errors.svelte';
    import Icon from '~/lib/components/Icon.svelte';
    import Input from '~/lib/components/Input.svelte';
    import Label from '~/lib/components/Label.svelte';
    import Link from '~/lib/components/Link.svelte';
    import LogoType from '~/lib/components/LogoType.svelte';
    import { createForm, formValidator } from '~/lib/utils/form.svelte';
    import type { ActionData } from './$types';
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

    let { form }: { form: ActionData } = $props();
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

<main class="px-8 py-16">
    <div class="w-full mx-auto">
        <LogoType class="h-24 mx-auto" />
        <h1 class="text-center mb-8 mt-8">Sign in</h1>
        <div class="max-w-[40ch] mx-auto">
            <form
                method="post"
                action="?/sign-in"
                class="space-y-6 w-full"
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
                    <div class="flex justify-between flex-wrap gap-2">
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
                    class="flex items-center gap-4 justify-center"
                >
                    <Icon name="google" />
                    Sign in with Google
                </Button>
            </form>
        </div>
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
