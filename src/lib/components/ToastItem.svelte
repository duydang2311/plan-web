<script lang="ts">
    import { createProgress, melt, type Toast, type ToastsElements } from '@melt-ui/svelte';
    import type { ToastData } from './Toaster.svelte';
    import { writable } from 'svelte/store';
    import { onMount } from 'svelte';
    import Button from './Button.svelte';
    import { IconXMark } from './icons';

    const {
        elements,
        toast
    }: { elements: ToastsElements; toast: Toast<ToastData<unknown, unknown>> } = $props();
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
    class="bg-base-3 border-base-border-1 relative w-full rounded-lg border p-4 shadow"
>
    <div
        use:melt={$progress}
        class="bg-primary-1/10 absolute left-4 top-4 h-1 w-[10%] overflow-hidden rounded-full"
    >
        <div
            class="bg-primary-1 h-full w-full"
            style={`transform: translateX(-${100 - (100 * ($percentage ?? 0)) / ($max ?? 1)}%)`}
        ></div>
    </div>

    <div class="mt-4 text-pretty">
        <h2 use:melt={$title(id)} class="text-h6 mb-2 font-semibold">
            {#if typeof data.title === 'string'}
                {data.title}
            {:else}
                {@render data.title(data.titleProps)}
            {/if}
        </h2>
        <div use:melt={$description(id)}>
            {#if typeof data.description === 'string'}
                {data.description}
            {:else}
                {@render data.description(data.descriptionProps)}
            {/if}
        </div>
    </div>
    <Button
        melt={$close(id)}
        variant="negative"
        filled={false}
        size="sm"
        class="absolute right-5 top-5 w-fit -translate-y-1/2 translate-x-1/2 p-1"
    >
        <IconXMark />
    </Button>
</div>
