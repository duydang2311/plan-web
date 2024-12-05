<script lang="ts">
    import { enhance } from '$app/forms';
    import { Editor } from '@tiptap/core';
    import DOMPurify from 'isomorphic-dompurify';
    import { Icon } from '~/lib/components';
    import Button from '~/lib/components/Button.svelte';
    import Tiptap from '~/lib/components/Tiptap.svelte';
    import type { Issue } from '~/lib/models/issue';
    import type { ActionData } from './$types';

    interface Props {
        form: ActionData;
        editing: boolean;
        issue: Pick<Issue, 'id' | 'title' | 'description'>;
        onCancel: () => void;
        onSubmit: () => void;
    }

    const { editing, issue, onCancel, onSubmit }: Props = $props();
    let editor = $state.raw<Editor>();
</script>

<div class="max-w-full pt-4 transition-enforcement">
    {#if editing}
        <div class="not-prose">
            <form
                method="post"
                action="?/edit-description"
                class="relative"
                use:enhance={(e) => {
                    if (!editor) {
                        e.cancel();
                        return;
                    }

                    e.formData.set('description', editor.getHTML());
                    return ({ update }) => {
                        onSubmit();
                        return update({ reset: true, invalidateAll: false });
                    };
                }}
            >
                <input type="hidden" name="issueId" value={issue.id} />
                <Tiptap
                    bind:editor
                    name="description"
                    content={issue.description}
                    editorProps={{ class: 'pb-8' }}
                />
                <div class="absolute right-2 bottom-2 flex gap-2">
                    <Button
                        size="sm"
                        variant="base"
                        onclick={onCancel}
                        class="flex gap-2 items-center"
                    >
                        <Icon name="x-mark" />
                        Cancel
                    </Button>
                    <Button size="sm" variant="primary" class="flex gap-2 items-center">
                        <Icon name="check" />
                        Save
                    </Button>
                </div>
            </form>
        </div>
    {:else}
        <div class="prose">
            {#if issue.description && issue.description !== '<p></p>'}
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html DOMPurify.sanitize(issue.description, { USE_PROFILES: { html: true } })}
            {:else}
                <p class="text-base-fg-3"><i>No description.</i></p>
            {/if}
        </div>
    {/if}
</div>
