<script lang="ts">
    import { enhance } from '$app/forms';
    import { Editor, Extension } from '@tiptap/core';
    import DOMPurify from 'isomorphic-dompurify';
    import { tick } from 'svelte';
    import { IconButton, TiptapEditor } from '~/lib/components';
    import { IconEditOutline } from '~/lib/components/icons';
    import { createInlineEdit } from '~/lib/runes/inline_edit.svelte';
    import type { OnTitleSubmit } from './types';

    const { content, onSubmit }: { content: string | undefined; onSubmit: OnTitleSubmit } =
        $props();
    const inlineEdit = createInlineEdit();
    let formEl = $state.raw<HTMLFormElement>();
    let editor = $state.raw<Editor>();
</script>

{#if inlineEdit.editing}
    <form
        bind:this={formEl}
        method="post"
        action="?/update_resource_document_content"
        class="mt-4 flex gap-2"
        use:enhance={(e) => {
            if (!editor) {
                e.cancel();
                return;
            }

            tick().then(() => {
                inlineEdit.editing = false;
            });
            e.formData.set('content', editor.getHTML());
            return onSubmit(e);
        }}
    >
        <TiptapEditor
            bind:editor
            {content}
            editorProps={{
                attributes: {
                    class: 'min-h-48 max-h-72 overflow-auto custom-scrollbar'
                }
            }}
            extensions={[
                Extension.create({
                    name: 'escape-inline-edit',
                    addKeyboardShortcuts() {
                        return {
                            Escape: () => {
                                inlineEdit.editing = false;
                                return true;
                            }
                        };
                    }
                }),
                Extension.create({
                    name: 'enter-submit',
                    addKeyboardShortcuts() {
                        return {
                            'Ctrl-Enter': () => {
                                formEl?.requestSubmit();
                                return true;
                            },
                            'Shift-Enter': () => {
                                formEl?.requestSubmit();
                                return true;
                            }
                        };
                    }
                })
            ]}
            onCreate={({ editor }) => {
                editor.commands.focus();
            }}
            class="w-full"
        />
    </form>
{:else}
    <div class="mt-4">
        {#if content}
            <section>
                <div class="group flex items-center gap-2" {@attach inlineEdit.root}>
                    <h2>Documentation</h2>
                    <IconButton
                        type="button"
                        variant="base"
                        class="text-base-fg-4 hidden items-center gap-2 group-hover:inline-flex"
                        onclick={() => {
                            inlineEdit.editing = true;
                        }}
                    >
                        Edit document
                        <IconEditOutline class="text-base-fg-4 size-3.5 align-baseline" />
                    </IconButton>
                </div>
                <div class="prose wrap-anywhere border-base-border-3 dark:bg-base-3 max-w-full rounded-lg border p-4 min-h-48">
                    {@html DOMPurify.sanitize(content, {
                        USE_PROFILES: { html: true }
                    })}
                </div>
            </section>
        {:else}
            <div class="c-text-secondary" {@attach inlineEdit.root}>
                <span>No document provided.</span>
                <IconEditOutline
                    class="text-base-fg-4 hidden size-3.5 align-baseline group-hover:inline-block"
                />
            </div>
        {/if}
    </div>
{/if}
