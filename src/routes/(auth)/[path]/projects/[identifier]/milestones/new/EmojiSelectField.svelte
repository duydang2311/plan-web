<script lang="ts">
    import twemoji from '@twemoji/api';
    import { Button, Field, Label } from '~/lib/components';
    import { IconChevronUpDown } from '~/lib/components/icons';
    import Popover from '~/lib/components/popover';
    import Emojis from './Emojis.svelte';

    const { emoji, onEmojiChange }: { emoji: string; onEmojiChange: (emoji: string) => void } =
        $props();

    const popover = new Popover.Builder({
        floatingConfig: {
            sameWidth: true
        }
    });
</script>

<Field>
    <Label for={popover.trigger.id}>Icon</Label>
    <input type="hidden" id="emoji" name="emoji" value={emoji} />
    <Button
        {...popover.trigger}
        type="button"
        variant="base"
        outline
        class="flex items-center justify-between gap-4 px-2 text-left"
    >
        <div class="size-5">
            {@html twemoji.parse(emoji)}
        </div>
        <IconChevronUpDown />
    </Button>
    {#if popover.open}
        <Popover {...popover.content} class="p-0">
            <Emojis {emoji} onChange={onEmojiChange} />
        </Popover>
    {/if}
</Field>
