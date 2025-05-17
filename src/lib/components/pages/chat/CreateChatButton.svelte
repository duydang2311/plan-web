<script lang="ts">
    import { writable } from 'svelte/store';
    import { Button } from '~/lib/components';
    import { IconPlus } from '~/lib/components/icons';
    import Popover from '../../popover';
    import CreateChatForm from './CreateChatForm.svelte';

    const { userId }: { userId: string } = $props();
    const builder = new Popover.Builder({
        forceVisible: true
    });
</script>

<Button
    variant="base"
    flat
    size="sm"
    filled={false}
    title="Create new chat"
    class="size-full"
    {...builder.trigger}
>
    <IconPlus />
</Button>
{#if builder.open}
    <Popover {...builder.content} class="max-w-paragraph-sm p-4">
        <CreateChatForm {userId} />
    </Popover>
{/if}
