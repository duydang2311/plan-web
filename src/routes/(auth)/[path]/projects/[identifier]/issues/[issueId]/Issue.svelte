<script lang="ts">
    import { enhance } from '$app/forms';
    import { Editor } from '@tiptap/core';
    import DOMPurify from 'isomorphic-dompurify';
    import { TiptapEditor, toast } from '~/lib/components';
    import Button from '~/lib/components/Button.svelte';
    import { IconCheck, IconXMark } from '~/lib/components/icons';
    import type { Ref } from '~/lib/utils/runes.svelte';
    import type { ActionData } from './$types';
    import type { LocalIssue } from './+page.server';

    interface Props {
        form: ActionData;
        editing: boolean;
        ref: Ref<LocalIssue>;
        onCancel: () => void;
        onSubmit: () => void;
    }

    const { editing, ref, onCancel, onSubmit }: Props = $props();
    let editor = $state.raw<Editor>();
</script>

{#if ref.value}
    <div class="flex gap-4">
        <h1>
            {ref.value.title}
        </h1>
        <span class="text-base-fg-ghost text-h1 font-light">
            #{ref.value.orderNumber}
        </span>
    </div>
    <div class="transition-enforcement mt-6 max-w-full">
        {#if editing}
            <div>
                <form
                    method="post"
                    action="?/edit-description"
                    class="relative"
                    use:enhance={(e) => {
                        if (!editor) {
                            e.cancel();
                            return;
                        }

                        const old = ref.value;
                        const description = editor.getHTML();
                        if (old) {
                            ref.value = {
                                ...old,
                                description
                            };
                        }
                        e.formData.set('description', description);
                        onSubmit();
                        return ({ result }) => {
                            if (result.type !== 'success') {
                                ref.value = old;
                                toast({
                                    type: 'negative',
                                    body: 'An unknown error happened while we were trying to update the description.'
                                });
                            }
                        };
                    }}
                >
                    <input type="hidden" name="issueId" value={ref.value.id} />
                        <TiptapEditor
                            bind:editor
                            content={ref.value.description}
                            class="max-w-paragraph-lg"
                            editorProps={{
                                attributes: {
                                    class: 'h-128 overflow-auto'
                                }
                            }}
                        />
                </form>
                    <div class="flex gap-2 w-fit ml-auto mt-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="base"
                            onclick={onCancel}
                            class="flex items-center gap-2 flex-1"
                        >
                            <IconXMark />
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            variant="primary"
                            class="flex items-center gap-2 flex-1"
                        >
                            <IconCheck />
                            Save
                        </Button>
                    </div>
            </div>
        {:else}
            <div class="prose max-w-paragraph-lg wrap-anywhere">
                {#if ref.value.description && ref.value.description !== '<p></p>'}
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html DOMPurify.sanitize(ref.value.description, {
                        USE_PROFILES: { html: true }
                    })}
                {:else}
                    <small class="text-base-fg-ghost font-medium"><i>Not available.</i></small>
                {/if}
            </div>
        {/if}
    </div>
{/if}
