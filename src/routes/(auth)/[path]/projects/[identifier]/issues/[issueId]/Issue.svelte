<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { Editor } from '@tiptap/core';
    import DOMPurify from 'isomorphic-dompurify';
    import { InlineEdit, Input, TiptapEditor, toast } from '~/lib/components';
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
    let titleEditing = $state.raw(false);
    let descFormEl = $state.raw<HTMLFormElement>();
</script>

{#if ref.value}
    <InlineEdit bind:editing={titleEditing}>
        {#snippet children({ editing, suppressNextKeyUp })}
            {#if editing}
                <form
                    class="w-full"
                    method="post"
                    action="?/edit_title"
                    use:enhance={(e) => {
                        const title = e.formData.get('title') as string;
                        const old = ref.value;
                        if (old) {
                            ref.value = {
                                ...old,
                                title
                            };
                        }
                        suppressNextKeyUp();
                        titleEditing = false;
                        return async ({ result }) => {
                            if (result.type === 'failure') {
                                ref.value = old;
                            }
                            await invalidateAll();
                        };
                    }}
                    title="Press Escape to cancel"
                >
                    <input type="hidden" name="issueId" value={ref.value!.id} />
                    <Input
                        type="text"
                        value={ref.value!.title}
                        name="title"
                        onkeydown={(e) => {
                            if (e.key === 'Escape') {
                                e.preventDefault();
                            } else if (e.key === 'Enter') {
                                e.stopPropagation();
                            }
                        }}
                        onkeyup={(e) => {
                            if (e.key === 'Escape') {
                                titleEditing = false;
                            }
                        }}
                        onblur={(e) => {
                            if (!titleEditing) {
                                return;
                            }
                            if (e.currentTarget.value !== ref.value!.title) {
                                e.currentTarget.form?.requestSubmit();
                            }
                            titleEditing = false;
                        }}
                        action={(node) => {
                            node.focus();
                        }}
                        class="text-h1 text-base-fg-1 h-full w-full px-4 font-bold"
                    />
                </form>
            {:else}
                <div
                    class="hover:bg-base-hover flex items-center gap-4 rounded-md px-2 transition"
                    title="Double click to edit"
                >
                    <h1>
                        {ref.value!.title}
                    </h1>
                    <span class="text-base-fg-ghost text-h1 font-light">
                        #{ref.value!.orderNumber}
                    </span>
                </div>
            {/if}
        {/snippet}
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
                        class="max-w-paragraph-lg"
                        editorProps={{
                            attributes: {
                                class: 'h-128 overflow-auto'
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
