<script lang="ts">
    import { enhance } from '$app/forms';
    import { Input } from '~/lib/components';
    import { createInlineEdit } from '~/lib/runes/inline_edit.svelte';
    import type { OnTitleSubmit } from './types';

    const {
        id,
        title,
        onSubmit
    }: {
        id: string;
        title: string;
        onSubmit: OnTitleSubmit;
    } = $props();
    const inlineEdit = createInlineEdit();
</script>

{#if inlineEdit.editing}
    <form
        method="post"
        action="?/update_title"
        use:enhance={(e) => {
            inlineEdit.editing = false;
            return onSubmit(id, e);
        }}
    >
        <input type="hidden" name="id" value={id} />
        <Input
            type="text"
            name="title"
            value={title}
            {@attach inlineEdit.input}
            class="text-h4 font-display w-full py-1 font-semibold"
        />
    </form>
{:else}
    <span class="text-h4 font-display font-semibold" {@attach inlineEdit.root}>
        {title}
    </span>
{/if}
