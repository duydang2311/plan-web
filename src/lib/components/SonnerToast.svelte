<script lang="ts">
    import Icon from './Icon.svelte';
    import type { ToastProps } from './Sonner.svelte';

    const { title, description, onDismiss }: ToastProps = $props();
</script>

<div
    class="bg-base-1 dark:bg-base-2 border-base-border-3 w-(--width) shadow-xs relative rounded-lg border p-4"
>
    {#if title}
        <h3 class="mb-4 leading-none">
            {title}
        </h3>
    {/if}
    {#if description}
        <p>{description}</p>
    {/if}
    <button
        type="button"
        onclick={onDismiss}
        class="text-base-fg-1 bg-base-1 dark:bg-base-2 border-base-border-3
            hover:bg-negative-1 hover:text-negative-fg-1 hover:border-negative-border
            absolute right-0 top-0 -translate-y-1/2 translate-x-1/2 rounded-full border transition
            group-[[data-expanded=false][data-front=false]]:hidden"
    >
        <Icon name="x-mark" />
    </button>
</div>
