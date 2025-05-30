<script lang="ts">
    import { enhance } from '$app/forms';
    import { IconEditOutline } from '~/lib/components/icons';
    import { createInlineEdit } from '~/lib/runes/inline_edit.svelte';
    import type { OnDescriptionSubmit } from './types';

    const {
        id,
        description,
        onSubmit
    }: { id: string; description: string | undefined; onSubmit: OnDescriptionSubmit } = $props();
    const inlineEdit = createInlineEdit();
    let formEl = $state.raw<HTMLFormElement>();
</script>

<div class="mt-2">
    {#if inlineEdit.editing}
        <form
            bind:this={formEl}
            method="post"
            action="?/update_description"
            use:enhance={(e) => {
                inlineEdit.editing = false;
                return onSubmit(id, e);
            }}
        >
            <input type="hidden" name="id" value={id} />
            <textarea
                name="description"
                class="c-input min-h-32 w-full resize-none"
                placeholder="Enter description..."
                value={description}
                onkeyup={(e) => {
                    if (e.key === 'Enter') {
                        inlineEdit.editing = false;
                        formEl?.requestSubmit();
                    }
                }}
                onkeypress={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                    }
                }}
                {@attach inlineEdit.input}
            ></textarea>
        </form>
    {:else}
        <div {@attach inlineEdit.root} class="group">
            <p class="c-text-secondary">
                {#if description && description.length > 0}
                    {description}
                {:else}
                    No description provided.
                {/if}
                <IconEditOutline class="text-base-fg-ghost ml-[0.25ch] hidden group-hover:inline" />
            </p>
        </div>
    {/if}
</div>
