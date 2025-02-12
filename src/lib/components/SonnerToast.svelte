<script lang="ts">
    import Icon from './Icon.svelte';
    import type { ToastProps } from './Sonner.svelte';

    const {
        title,
        description,
        titleProps,
        descriptionProps,
        onDismiss
    }: ToastProps<unknown, unknown> = $props();
</script>

<div
    class="bg-base-1 dark:bg-base-2 border-base-border-3 relative w-(--width) rounded-lg border p-4 shadow-xs"
>
    {#if title != null}
        <h3 class="mb-4 leading-none">
            {#if typeof title === 'function'}
                {@render title(titleProps)}
            {:else}
                {title}
            {/if}
        </h3>
    {/if}
    {#if description != null}
        <p>
            {#if typeof description === 'function'}
                {@render description(descriptionProps)}
            {:else}
                {description}
            {/if}
        </p>
    {/if}
    <button
        type="button"
        onclick={onDismiss}
        class="text-base-fg-1 bg-base-1 dark:bg-base-2 border-base-border-3
            hover:bg-negative-1 hover:text-negative-fg-1 hover:border-negative-border
            absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 rounded-full border transition
            group-[[data-expanded=false][data-front=false]]:hidden"
    >
        <Icon name="x-mark" />
    </button>
</div>
