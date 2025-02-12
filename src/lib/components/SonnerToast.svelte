<script lang="ts" module>
    const borderClass = {
        none: 'border-base-border-3',
        positive: 'border-positive-border/20 dark:border-positive-border/60',
        negative: 'border-negative-border/20 dark:border-negative-border/40'
    };
</script>

<script lang="ts">
    import Icon from './Icon.svelte';
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
        'bg-base-1 dark:bg-base-2 relative w-(--width) rounded-lg border p-4 shadow-sm',
        borderClass[type ?? 'none']
    ]}
>
    <div class="flex items-center gap-4">
        {#if type === 'positive'}
            <Icon name="success" class="text-positive-1 size-6" />
        {:else if type === 'negative'}
            <Icon name="failure" class="text-negative-1 size-6" />
        {/if}
        {@render bodySnippet()}
    </div>
    <button
        type="button"
        onclick={onDismiss}
        class={[
            `text-base-fg-1 bg-base-1 dark:bg-base-2 border-base-border-3
            hover:bg-negative-1 hover:text-negative-fg-1 hover:border-negative-border
            absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 rounded-full border transition
            group-[[data-expanded=false][data-front=false]]:hidden`,
            borderClass[type ?? 'none']
        ]}
    >
        <Icon name="x-mark" />
    </button>
</div>
