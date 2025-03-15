<script lang="ts" module>
    const borderClass = {
        positive: 'border-b-positive-border/40 dark:border-b-positive-border/60',
        negative: 'border-b-negative-border/40 dark:border-b-negative-border/40'
    };
</script>

<script lang="ts">
    import { IconFailure, IconSuccess, IconXMark } from './icons';
    import type { ToastProps } from './Sonner.svelte';

    const { type, body, bodyProps, onDismiss }: ToastProps<unknown> = $props();
</script>

{#snippet bodySnippet()}
    <div>
        {#if typeof body === 'function'}
            {@render body(bodyProps)}
        {:else}
            {body}
        {/if}
    </div>
{/snippet}

<div
    class={[
        'bg-base-1 dark:bg-base-2 w-(--width) border-base-border-3 relative rounded-lg border p-4 shadow-sm',
        type ? borderClass[type] : undefined
    ]}
>
    <div class="flex items-center gap-4">
        {#if type === 'positive'}
            <IconSuccess class="text-positive-1 size-6 shrink-0" />
        {:else if type === 'negative'}
            <IconFailure class="text-negative-1 size-6 shrink-0" />
        {/if}
        {@render bodySnippet()}
    </div>
    <button
        type="button"
        onclick={onDismiss}
        class={[
            `text-base-fg-1 bg-base-1 dark:bg-base-2 border-base-border-3
            hover:bg-negative-1 hover:text-negative-fg-1 hover:border-negative-border
            absolute right-0 top-0 -translate-y-1/2 translate-x-1/2 rounded-full border transition
            group-[[data-expanded=false][data-front=false]]:hidden`
        ]}
    >
        <IconXMark />
    </button>
</div>
