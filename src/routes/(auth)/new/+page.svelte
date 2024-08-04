<script lang="ts">
    import { enhance } from '$app/forms';
    import Button from '~/lib/components/Button.svelte';
    import Errors from '~/lib/components/Errors.svelte';
    import Field from '~/lib/components/Field.svelte';
    import Input from '~/lib/components/Input.svelte';
    import Label from '~/lib/components/Label.svelte';
    import type { ActionData } from './$types';
    import { page } from '$app/stores';

    const errorMap = {
        root: {
            fetch: 'Could not issue the request',
            404: 'Could not reach the server',
            500: 'An unknown error has occurred on the server'
        },
        name: {
            string: 'Enter workspace name',
            empty: 'Enter workspace name',
            pattern:
                'Enter workspace name that only includes letters, numbers, dashes, underscores and spaces'
        },
        path: {
            string: 'Enter workspace URL',
            empty: 'Enter workspace URL',
            keywords: 'The URL was reserved for internal uses, please use another one',
            duplicated: 'The URL has been used by another.'
        }
    };

    let name = $state<string>('');
    let path = $state<{ value: string; dirty: boolean }>({
        value: '',
        dirty: false
    });
    let spanWidth = $state<number>();

    let { form }: { form: ActionData } = $props();
    const errors = $derived(form?.errors as Record<string, string[]> | undefined);
</script>

<main
    class="max-w-paragraph-sm lg:max-w-paragraph-lg flex flex-col mx-auto justify-center min-h-screen h-full space-y-4 p-8"
>
    <p class="text-title font-medium text-center">Create a new workspace</p>
    <p class="text-center text-balance">
        Workspaces are shared environments where teams can work on projects, cycles and issues.
    </p>
    <form method="post" class="!mt-8 max-w-paragraph-sm w-full mx-auto" use:enhance>
        <Errors errors={errors?.['root']} errorMap={errorMap.root} class="text-center" />
        <div class="space-y-4 mt-4">
            <Field>
                <Label for="name">Workspace name</Label>
                <Input
                    type="text"
                    name="name"
                    bind:value={name}
                    oninput={({ currentTarget }) => {
                        if (path.dirty || !(currentTarget instanceof HTMLInputElement)) return;
                        path.value = currentTarget.value.replaceAll(' ', '-').toLowerCase();
                    }}
                />
                <Errors errors={errors?.['name']} errorMap={errorMap.name} />
            </Field>
            <Field>
                <Label for="path">Workspace URL</Label>
                <div class="relative">
                    <Input
                        type="text"
                        name="path"
                        style="padding-inline-start: calc({spanWidth}px + 7px);"
                        bind:value={path.value}
                        oninput={({ currentTarget }) => {
                            if (!(currentTarget instanceof HTMLInputElement)) return;
                            const value = currentTarget.value;
                            if (value.length === 0) {
                                path = { dirty: false, value: name };
                            } else {
                                path.dirty = value !== name;
                            }
                        }}
                    />
                    <span
                        class="absolute opacity-40 left-2 top-1/2 -translate-y-1/2"
                        bind:clientWidth={spanWidth}
                    >
                        {$page.url.origin}/
                    </span>
                </div>
                <Errors errors={errors?.['path']} errorMap={errorMap.path} />
            </Field>
            <Button class="!mt-8">Create workspace</Button>
        </div>
    </form>
</main>
