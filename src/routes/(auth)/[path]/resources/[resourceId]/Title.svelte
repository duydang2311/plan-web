<script lang="ts">
    import { enhance } from '$app/forms';
    import { Button, Input } from '~/lib/components';
    import { IconCheck, IconEditOutline, IconXMark } from '~/lib/components/icons';
    import { createInlineEdit } from '~/lib/runes/inline_edit.svelte';
    import type { OnTitleSubmit } from './types';

    const { name, onSubmit }: { name: string; onSubmit: OnTitleSubmit } = $props();
    const inlineEdit = createInlineEdit();
</script>

{#if inlineEdit.editing}
    <form
        method="post"
        action="?/update_resource_name"
        class="flex gap-2"
        use:enhance={(e) => {
            inlineEdit.editing = false;
            return onSubmit(e);
        }}
    >
        <Input
            type="text"
            name="name"
            value={name}
            placeholder="Enter resource title"
            class="text-h1 text-base-fg-1 py-0 font-bold"
            {@attach inlineEdit.input}
        />
        <Button
            type="button"
            variant="base"
            outline
            class="flex w-fit items-center gap-2 text-sm"
            onclick={() => {
                inlineEdit.editing = false;
            }}
        >
            <IconXMark />
            Cancel
        </Button>
        <Button type="submit" variant="primary" class="flex w-fit items-center gap-2 text-sm">
            <IconCheck />
            Save
        </Button>
    </form>
{:else}
    <h1 class="group font-h-bold" {@attach inlineEdit.root}>
        <span>{name}</span>
        <IconEditOutline
            class="text-base-fg-4 hidden size-6 align-baseline group-hover:inline-block"
        />
    </h1>
{/if}
