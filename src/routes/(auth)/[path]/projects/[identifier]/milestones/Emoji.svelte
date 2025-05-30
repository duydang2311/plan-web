<script lang="ts">
    import twemoji from '@twemoji/api';
    import Popover from '~/lib/components/popover';
    import Emojis from './new/Emojis.svelte';

    const {
        id,
        emoji,
        color,
        onChange
    }: { id: string; emoji: string; color: string; onChange: (id: string, emoji: string) => void } =
        $props();
    const popover = new Popover.Builder({
        forceVisible: true
    });
</script>

<div>
    <button
        {...popover.trigger}
        type="button"
        class="emoji rounded-xl p-4 transition"
        style="--_bg: {color};"
    >
        <div class="size-8">
            {@html twemoji.parse(emoji)}
        </div>
    </button>
    {#if popover.open}
        <!-- TODO: make this a shared component -->
        <Popover {...popover.content} class="p-0">
            <Emojis {emoji} onChange={(emoji) => onChange(id, emoji)} />
        </Popover>
    {/if}
</div>

<style>
    .emoji {
        background-color: color-mix(in oklch, var(--_bg) 20%, transparent);
        &:hover {
            background-color: color-mix(in oklch, var(--_bg) 40%, transparent);
        }
        &:active {
            background-color: color-mix(in oklch, var(--_bg) 20%, transparent);
        }
    }
</style>
