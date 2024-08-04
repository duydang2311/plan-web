<script lang="ts">
    import { createProgress, melt, type Toast, type ToastsElements } from '@melt-ui/svelte';
    import type { ToastData } from './Toaster.svelte';
    import { writable } from 'svelte/store';
    import { onMount } from 'svelte';
    import Icon from './Icon.svelte';
    import Button from './Button.svelte';

    const { elements, toast }: { elements: ToastsElements; toast: Toast<ToastData> } = $props();
    const { content, title, description, close } = $derived(elements);
    const { data, id, getPercentage } = $derived(toast);

    const percentage = writable(0);
    const {
        elements: { root: progress },
        options: { max }
    } = createProgress({
        max: 100,
        value: percentage
    });

    onMount(() => {
        let frame: number;
        const updatePercentage = () => {
            percentage.set(getPercentage());
            frame = requestAnimationFrame(updatePercentage);
        };
        frame = requestAnimationFrame(updatePercentage);

        return () => cancelAnimationFrame(frame);
    });
</script>

<div
    use:melt={$content(id)}
    class="relative rounded-lg bg-base-1 border border-base-border shadow p-4 w-full"
>
    <div
        use:melt={$progress}
        class="absolute left-4 top-4 h-1 w-[10%] overflow-hidden rounded-full bg-primary-1/10"
    >
        <div
            class="h-full w-full bg-primary-1"
            style={`transform: translateX(-${100 - (100 * ($percentage ?? 0)) / ($max ?? 1)}%)`}
        ></div>
    </div>

    <div class="mt-4">
        <p use:melt={$title(id)} class="font-medium text-h5">
            {#if typeof data.title === 'string'}
                {data.title}
            {:else}
                {@render data.title()}
            {/if}
        </p>
        <div use:melt={$description(id)}>
            {#if typeof data.description === 'string'}
                {data.description}
            {:else}
                {@render data.description()}
            {/if}
        </div>
    </div>
    <Button
        melt={$close(id)}
        variant="negative"
        filled={false}
        size="sm"
        class="absolute w-fit p-1 right-5 top-5 translate-x-1/2 -translate-y-1/2"
    >
        <Icon name="x-mark" />
    </Button>
</div>
