<script lang="ts">
    import { enhance } from '$app/forms';
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
        <div {@attach inlineEdit.root}>
            {#if description && description.length > 0}
                <p class="c-text-secondary">
                    {description}
                </p>
            {:else}
                <p class="c-text-secondary">No description provided.</p>
            {/if}
        </div>
    {/if}
</div>
