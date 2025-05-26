<script lang="ts">
    import { IconButton } from '~/lib/components';

    const {
        html,
        unicode,
        selected,
        onClick,
    }: {
        html: string | undefined;
        unicode: string;
        selected: boolean;
        onClick: (unicode: string) => void;
    } = $props();
</script>

{#if html}
    <IconButton
        type="button"
        variant="base"
        data-emoji-selected={selected ? '' : undefined}
        class="size-full p-1 data-[emoji-selected]:not-hover:not-active:bg-base-selected"
        onclick={() => {
            onClick(unicode);
        }}
    >
        {@html html}
    </IconButton>
{:else}
    <div class="size-full p-1"></div>
{/if}
