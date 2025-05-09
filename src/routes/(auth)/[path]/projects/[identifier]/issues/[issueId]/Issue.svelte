<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { Editor } from '@tiptap/core';
    import DOMPurify from 'isomorphic-dompurify';
    import { InlineEdit, TiptapEditor, toast } from '~/lib/components';
    import Button from '~/lib/components/Button.svelte';
    import { IconCheck, IconXMark } from '~/lib/components/icons';
    import type { Ref } from '~/lib/utils/runes.svelte';
    import type { ActionData } from './$types';
    import type { LocalIssue } from './+page.server';

    interface Props {
        form: ActionData;
        editing: boolean;
        ref: Ref<LocalIssue>;
    }

    let { editing = $bindable(), ref = $bindable() }: Props = $props();
    let editor = $state.raw<Editor>();
    let descFormEl = $state.raw<HTMLFormElement>();
</script>

{#if ref.value}
    <InlineEdit
        name="title"
        value={ref.value.title}
        action="?/edit_title"
        inputProps={{
            class: 'text-h1 text-base-fg-1 font-bold'
        }}
        onSubmit={(e) => {
            if (!ref.value) {
                e.cancel();
                return;
            }

            e.formData.set('issueId', ref.value.id);
            const title = e.formData.get('title') as string;
            const old = ref.value;
            if (old) {
                ref.value = {
                    ...old,
                    title
                };
            }
            return async ({ result }) => {
                if (result.type === 'failure') {
                    ref.value = old;
                }
                await invalidateAll();
            };
        }}
    >
        <h1>
            {ref.value!.title}
            <span class="text-base-fg-ghost text-h1 font-light">
                #{ref.value!.orderNumber}
            </span>
        </h1>
    </InlineEdit>
    <div class="transition-enforcement mt-6 max-w-full">
        {#if editing}
            <div>
                <form
                    bind:this={descFormEl}
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
                        editing = false;
                        return async ({ result }) => {
                            if (result.type !== 'success') {
                                ref.value = old;
                                toast({
                                    type: 'negative',
                                    body: 'An unknown error happened while trying to update the description.'
                                });
                            }
                        };
                    }}
                >
                    <input type="hidden" name="issueId" value={ref.value.id} />
                    <TiptapEditor
                        bind:editor
                        content={ref.value.description}
                        editorProps={{
                            attributes: {
                                class: 'min-h-92 max-h-160 overflow-auto'
                            }
                        }}
                        onCreate={(e) => {
                            e.editor.on('submit', () => {
                                descFormEl?.requestSubmit();
                            });
                            e.editor.commands.focus('end');
                        }}
                    />
                    <div class="ml-auto mt-2 flex w-fit gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="base"
                            onclick={() => {
                                editing = false;
                            }}
                            class="flex flex-1 items-center gap-2"
                        >
                            <IconXMark />
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            variant="primary"
                            class="flex flex-1 items-center gap-2"
                        >
                            <IconCheck />
                            Save
                        </Button>
                    </div>
                </form>
            </div>
        {:else}
            <div class="prose max-w-full wrap-anywhere">
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
