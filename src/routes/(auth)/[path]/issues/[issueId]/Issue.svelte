<script lang="ts">
    import { page } from '$app/stores';
    import DOMPurify from 'isomorphic-dompurify';
    import Button from '~/lib/components/Button.svelte';
    import Tiptap from '~/lib/components/Tiptap.svelte';
    import { enhance } from '$app/forms';
    import { Editor } from '@tiptap/core';
    import type { ActionData } from './$types';
    import { scaleIn, scaleOut, slideIn, slideOut } from './transitions';
    import { fluentSearchParams } from '~/lib/utils/url';
    import Dialog from '~/lib/components/Dialog.svelte';
    import { melt } from '@melt-ui/svelte';
    import type { Issue } from '~/lib/models/issue';
    import { fade } from 'svelte/transition';
    import { writable } from 'svelte/store';
    import { addToast } from '~/lib/components/Toaster.svelte';

    interface Props {
        form: ActionData;
        isEditing: boolean;
        issue: Issue;
    }

    const { isEditing, issue }: Props = $props();
    const cancelHref = $derived(fluentSearchParams($page.url).delete('edit-desc').toString());
    const editHref = $derived(fluentSearchParams($page.url).set('edit-desc', '').toString());
    const open = writable(false);
    let editor = $state<Editor>();
</script>

<div class="border-b border-b-base-border pb-2">
    <div class="max-w-full pt-4">
        {#if isEditing}
            <div in:slideIn out:slideOut class="not-prose">
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
                    }}
                >
                    <input type="hidden" name="issueId" value={$page.params['issueId']} />
                    <Tiptap
                        bind:editor
                        name="description"
                        content={issue.description}
                        containerProps={{ class: 'pb-8' }}
                    />
                    <div class="absolute right-2 bottom-2 flex gap-2">
                        <Button as="link" href={cancelHref} size="sm" filled={false} variant="base"
                            >Cancel</Button
                        >
                        <Button size="sm" variant="primary" filled={false}>Save</Button>
                    </div>
                </form>
            </div>
        {:else}
            <div in:slideIn out:slideOut class="prose">
                {#if issue.description && issue.description !== '<p></p>'}
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html DOMPurify.sanitize(issue.description, { USE_PROFILES: { html: true } })}
                {:else}
                    <p class="text-base-fg-3"><i>No description.</i></p>
                {/if}
            </div>
        {/if}
    </div>
    <div class="mt-8 flex gap-2">
        <Button as="link" href={editHref} variant="base" filled={false} size="sm" class="w-fit">
            Edit
        </Button>
        <Button
            variant="negative"
            filled={false}
            size="sm"
            onclick={() => {
                $open = true;
            }}
            class="w-fit">Delete</Button
        >
    </div>
</div>

<Dialog
    role="alertdialog"
    {open}
    defaultOpen={true}
    onclose={() => {
        $open = false;
    }}
>
    {#snippet children({ overlay, content, title, close })}
        <div
            transition:fade={{ duration: 200 }}
            use:melt={overlay}
            class="fixed inset-0 bg-black/20"
        ></div>
        <div
            in:scaleIn
            out:scaleOut
            use:melt={content}
            class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-base-1 p-8 rounded-md w-full max-w-paragraph-sm lg:max-w-paragraph-lg space-y-2 border border-base-border"
        >
            <h4 use:melt={title}>Confirm issue deletion</h4>
            <p>
                Proceed to delete <span class="font-medium">"{issue.title}"</span>?
            </p>
            <div class="flex gap-4 w-fit ml-auto">
                <Button variant="base" class="w-fit" filled={false} melt={close}>Cancel</Button>
                <form
                    method="post"
                    action="?/delete-issue"
                    use:enhance={() => {
                        return async ({ result, update }) => {
                            if (result.type === 'redirect') {
                                addToast({
                                    data: {
                                        title: 'Issue deleted',
                                        description
                                    }
                                });
                            }
                            await update();
                        };
                    }}
                >
                    <input type="hidden" name="issueId" value={$page.params['issueId']} />
                    <Button variant="negative" class="w-fit">Delete</Button>
                </form>
            </div>
        </div>
    {/snippet}
</Dialog>

{#snippet description()}
    "<span class="font-medium">{issue.title}</span>" has been deleted.
{/snippet}
