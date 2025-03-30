<script lang="ts">
    import { melt } from '@melt-ui/svelte';
    import { writable } from 'svelte/store';
    import { Button, PopoverBuilder } from '~/lib/components';
    import { IconPlus } from '~/lib/components/icons';
    import CreateChatForm from './CreateChatForm.svelte';
    import { popover, tsap } from '~/lib/utils/transition';

    const { userId }: { userId: string } = $props();
    const open = writable(false);
</script>

<PopoverBuilder options={{ open, forceVisible: true }}>
    {#snippet children({ trigger, content })}
        <Button
            variant="base"
            flat
            size="sm"
            filled={false}
            title="Create new chat"
            class="size-full"
            melt={trigger}
        >
            <IconPlus />
        </Button>
        {#if $open}
            <div
                class="c-popover w-paragraph-sm"
                use:melt={content}
                in:tsap={popover.in}
                out:tsap={popover.out}
            >
                <CreateChatForm {userId} />
            </div>
        {/if}
    {/snippet}
</PopoverBuilder>
