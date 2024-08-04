<script lang="ts" context="module">
    import gsap from 'gsap';
    export interface ToastData {
        title: string | Snippet;
        description: string | Snippet;
    }

    const {
        elements,
        helpers,
        states: { toasts },
        actions: { portal }
    } = createToaster<ToastData>();

    export const addToast = helpers.addToast;

    function flyIn(node: HTMLElement) {
        gsap.from(node, {
            xPercent: 100,
            opacity: 0,
            duration: 0.3,
            ease: 'power4.out',
            clearProps: 'y'
        });
        return {
            duration: 300
        };
    }

    function flyOut(node: HTMLElement) {
        gsap.to(node, { xPercent: 100, opacity: 0, duration: 0.3, ease: 'power4.in' });
        return {
            duration: 300
        };
    }
</script>

<script lang="ts">
    import { createToaster } from '@melt-ui/svelte';
    import ToastItem from './ToastItem.svelte';
    import { flip } from 'svelte/animate';
    import type { Snippet } from 'svelte';
</script>

<div
    class="fixed bottom-4 z-50 flex flex-col items-end ease-in-out gap-2 max-md:inset-x-4 md:right-4 md:w-full md:max-w-paragraph-sm"
    use:portal
>
    {#each $toasts as toast (toast.id)}
        <div in:flyIn out:flyOut animate:flip={{ duration: 300 }} class="w-full">
            <ToastItem {elements} {toast} />
        </div>
    {/each}
</div>
