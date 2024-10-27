<script lang="ts">
    import { enhance } from '$app/forms';
    import Button from '~/lib/components/Button.svelte';
    import Errors from '~/lib/components/Errors.svelte';
    import Input from '~/lib/components/Input.svelte';
    import Label from '~/lib/components/Label.svelte';
    import { createForm, formValidator } from '~/lib/utils/form.svelte';
    import type { ActionData, PageData } from './$types';
    import { validate } from './utils';

    const errorMap = {
        root: {
            unknown: 'An unknown error has occurred on server',
            fetch: 'Could not issue the request',
            500: 'An unknown error has occurred on server',
            404: 'Could not connect to server'
        },
        name: {
            required: 'Enter workspace name'
        },
        identifier: {
            required: 'Enter workspace identifier',
            maxLength: 'Enter workspace identifier with 5 characters at most',
            invalid: 'The identifier has been reserved for internal usage'
        }
    };

    let { form, data }: { form: ActionData; data: PageData } = $props();
    let status = $state<'submitting' | null>(null);
    let dirty = $state(false);

    const errors = $derived(form?.errors ?? {}) as Record<string, string[]>;
    const helperForm = createForm({
        validator: formValidator(validate)
    });
    const fields = {
        workspaceId: helperForm.createField({
            name: 'workspaceId',
            initialValue: data.workspace.id
        }),
        name: helperForm.createField({ name: 'name' }),
        identifier: helperForm.createField({ name: 'identifier' }),
        description: helperForm.createField({ name: 'description' })
    };

    function nameToIdentifier(name: string) {
        return name
            .replace(/[^A-Za-z0-9\s-]/g, '')
            .replace(/\s/g, '-')
            .toLocaleLowerCase();
    }
</script>

<main class="max-w-paragraph-lg mx-auto p-8 space-y-8">
    <div>
        <h2 class="mb-2">Create a project</h2>
        <p class="mb-8">Create a project to manage separate group of issues.</p>
        <hr />
    </div>

    <form
        method="post"
        class="space-y-2"
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
        <input
            type="hidden"
            name={fields.workspaceId.state.name}
            value={fields.workspaceId.state.value}
        />
        <div class="flex gap-4 flex-wrap">
            <fieldset class="space-y-1 grow">
                <Label for="name">Name</Label>
                <Input
                    useField={fields.name}
                    id="name"
                    name={fields.name.state.name}
                    autofocus
                    required
                    bind:value={fields.name.state.value}
                    oninput={() => {
                        if (!dirty) {
                            fields.identifier.state.value = nameToIdentifier(
                                fields.name.state.value
                            );
                        }
                    }}
                />
                <Errors errors={fields.name.state.errors} />
            </fieldset>
            <fieldset class="space-y-1 grow basis-48">
                <Label for="identifier">Identifier</Label>
                <Input
                    useField={fields.identifier}
                    id="identifier"
                    name={fields.identifier.state.name}
                    autofocus
                    required
                    bind:value={fields.identifier.state.value}
                    oninput={() => {
                        if (fields.identifier.state.value === '') {
                            dirty = false;
                        } else if (
                            fields.identifier.state.value !==
                            nameToIdentifier(fields.name.state.value)
                        ) {
                            dirty = true;
                        }
                    }}
                    onblur={() => {
                        if (!dirty && fields.identifier.state.value === '') {
                            fields.identifier.state.value = nameToIdentifier(
                                fields.name.state.value
                            );
                        }
                    }}
                    class="lowercase"
                />
                <p class="text-base-fg-3">
                    <small
                        >The identifier (e.g. {fields.identifier.length
                            ? fields.identifier.state.value.toLocaleLowerCase()
                            : 'project-abc'}) of the project to be displayed in the URL.</small
                    >
                </p>
                <Errors errors={fields.identifier.state.errors} errorMap={errorMap.identifier} />
            </fieldset>
        </div>
        <fieldset class="space-y-1">
            <Label for="description">Description (optional)</Label>
            <Input
                useField={fields.description}
                id="description"
                name={fields.description.state.name}
                autofocus
                aria-invalid={errors['description'] ? 'true' : undefined}
                bind:value={fields.description.state.value}
            />
            <Errors errors={fields.description.state.errors} />
        </fieldset>
        <Button variant="primary" class="!mt-4 capitalize w-fit" disabled={status === 'submitting'}>
            Create project
        </Button>
    </form>
    <Errors errors={errors['root']} errorMap={errorMap.root} />
</main>
