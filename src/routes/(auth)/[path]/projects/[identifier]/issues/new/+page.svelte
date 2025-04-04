<script lang="ts">
    import { enhance } from '$app/forms';
    import { type SelectOption } from '@melt-ui/svelte';
    import { Editor } from '@tiptap/core';
    import { writable } from 'svelte/store';
    import { TiptapEditor } from '~/lib/components';
    import Button from '~/lib/components/Button.svelte';
    import Errors from '~/lib/components/Errors.svelte';
    import Input from '~/lib/components/Input.svelte';
    import Label from '~/lib/components/Label.svelte';
    import { createForm, formValidator } from '~/lib/utils/form.svelte';
    import { createEffect } from '~/lib/utils/runes.svelte';
    import type { ActionData, PageData } from './$types';
    import ProjectSelect from './ProjectSelect.svelte';
    import { validate } from './utils';

    const errorMap = {
        root: {
            unknown: 'An unknown error has occurred on server',
            fetch: 'Could not issue the request',
            500: 'An unknown error has occurred on server',
            404: 'Could not connect to server',
            403: 'Could not create issue due to lack of privileges'
        },
        projectId: {
            valueMissing: 'Select a project'
        },
        title: {
            string: 'Enter issue title',
            valueMissing: 'Enter issue title'
        },
        description: {
            string: 'Enter issue description',
            maxLength: 'Enter issue description with 65535 characters at most'
        }
    };

    let { form, data }: { form: ActionData; data: PageData } = $props();
    let status = $state<'submitting' | null>(null);
    let editor = $state.raw<Editor>();
    const helperForm = createForm({ validator: formValidator(validate) });
    const fields = {
        projectId: helperForm.createField({
            name: 'projectId'
        }),
        title: helperForm.createField({ name: 'title' }),
        description: helperForm.createField({ name: 'description' })
    };
    const selected = writable<SelectOption<string>>({
        label: data.project.name,
        value: data.project.id
    });

    $effect(() => {
        if (!editor) {
            return;
        }
        editor.on('transaction', ({ editor }) => {
            fields.description.state.value = editor.getText();
        });
    });

    $effect(() => {
        if (form?.errors) {
            helperForm.setErrors(form.errors);
        }
    });

    createEffect(
        () => {
            if ($selected) {
                fields.projectId.state.value = $selected.value;
                fields.projectId.setErrors(fields.projectId.validate());
            }
        },
        () => $selected
    );
</script>

<main class="mx-auto max-h-full max-w-screen-lg overflow-auto p-8">
    <div class="border-b-base-border-3 mb-8 border-b pb-1">
        <h2>Create issue</h2>
        <p>Fill in the form below to create a new issue.</p>
    </div>
    <form
        method="post"
        class="space-y-4"
        use:helperForm
        use:enhance={(e) => {
            if (!editor) {
                e.cancel();
                return;
            }

            helperForm.validate();
            if (!helperForm.isValid()) {
                e.cancel();
                return;
            }

            const desc = editor!.getHTML();
            if (desc) {
                e.formData.set('description', desc);
            }
            status = 'submitting';
            return async ({ update }) => {
                status = null;
                await update();
            };
        }}
    >
        <div class="flex flex-wrap gap-4">
            <fieldset class="w-60 min-w-60 space-y-1 max-sm:basis-full">
                <ProjectSelect workspaceId={data.workspace.id} {selected} />
                <input
                    use:fields.projectId
                    type="text"
                    name={fields.projectId.state.name}
                    value={$selected?.value}
                    required
                    hidden
                />
                <Errors errors={fields.projectId.state.errors} errorMap={errorMap.projectId} />
            </fieldset>
            <fieldset class="flex-1 space-y-1">
                <Label for="title">Title</Label>
                <Input
                    useField={fields.title}
                    id="title"
                    name={fields.title.state.name}
                    bind:value={fields.title.state.value}
                    required
                />
                <Errors errors={fields.title.state.errors} errorMap={errorMap.title} />
            </fieldset>
        </div>
        <fieldset class="grow space-y-1">
            <Label for="description">Description (optional)</Label>
            <div>
                <TiptapEditor
                    bind:editor
                    editorProps={{
                        attributes: {
                            class: 'h-80 overflow-auto'
                        }
                    }}
                />
            </div>
            <Errors errors={fields.description.state.errors} errorMap={errorMap.description} />
        </fieldset>
        <Button variant="primary" class="w-fit" disabled={status === 'submitting'}>
            Create issue
        </Button>
    </form>
    {#if form?.errors}
        <Errors errors={form.errors.root} errorMap={errorMap.root} />
    {/if}
</main>
