<script lang="ts">
    import { enhance } from '$app/forms';
    import { Editor } from '@tiptap/core';
    import Button from '~/lib/components/Button.svelte';
    import Errors from '~/lib/components/Errors.svelte';
    import Input from '~/lib/components/Input.svelte';
    import Label from '~/lib/components/Label.svelte';
    import Tiptap from '~/lib/components/Tiptap.svelte';
    import { createForm, formValidator } from '~/lib/utils/form.svelte';
    import type { ActionData, PageData } from './$types';
    import { validate } from './utils';

    const errorMap = {
        root: {
            unknown: 'An unknown error has occurred on server',
            fetch: 'Could not issue the request',
            500: 'An unknown error has occurred on server',
            404: 'Could not connect to server',
            403: 'Could not create issue due to lack of privileges'
        },
        title: {
            string: 'Enter issue title'
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
        teamId: helperForm.createField({ name: 'teamId', initialValue: data.team.id }),
        title: helperForm.createField({ name: 'title' }),
        description: helperForm.createField({ name: 'description' })
    };

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
</script>

<main class="max-w-screen-lg mx-auto p-8 space-y-8 max-h-full overflow-auto">
    <div>
        <h2>Create a new issue</h2>
        <p class="mb-4">
            Create a new issue to manage separate cycles, workflows and notifications.
        </p>
        <hr />
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
        <input type="hidden" name={fields.teamId.state.name} value={fields.teamId.state.value} />
        <fieldset class="space-y-1 grow">
            <Label for="title">Issue title</Label>
            <Input
                useField={fields.title}
                id="title"
                name={fields.title.state.name}
                bind:value={fields.title.state.value}
                autofocus
                required
            />
            <Errors errors={fields.title.state.errors} />
        </fieldset>
        <fieldset class="space-y-1 grow">
            <Label for="description">Issue description (optional)</Label>
            <div>
                <Tiptap
                    bind:editor
                    placeholder="Add more detail to the issue..."
                    editorProps={{
                        class: 'h-80'
                    }}
                />
            </div>
            <Errors errors={fields.description.state.errors} errorMap={errorMap.description} />
        </fieldset>
        <Button variant="primary" class="!mt-4 w-fit" disabled={status === 'submitting'}>
            Create issue
        </Button>
    </form>
    {#if form?.errors}
        <Errors errors={form.errors.root} errorMap={errorMap.root} />
    {/if}
</main>
