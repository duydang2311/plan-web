<script lang="ts" module>
    import gsap from 'gsap';
    import type { Snippet } from 'svelte';
    import type { AddToastProps } from '@melt-ui/svelte';

    export interface ToastData<TProps = unknown, DProps = unknown> {
        title: string | Snippet<[TProps]>;
        description: string | Snippet<[DProps]>;
        titleProps?: TProps;
        descriptionProps?: DProps;
    }

    const {
        elements,
        helpers,
        states: { toasts },
        actions: { portal }
    } = createToaster<ToastData>();

    export const addToast = <TProps = unknown, DProps = unknown>(
        props: AddToastProps<ToastData<TProps, DProps>>
    ) => {
        return helpers.addToast(props as AddToastProps<ToastData>);
    };

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
    import { flip } from 'svelte/animate';
    import ToastItem from './ToastItem.svelte';
</script>

<div
    class="md:max-w-paragraph-sm fixed bottom-4 z-50 flex flex-col items-end gap-2 max-md:inset-x-4 md:right-4 md:w-full"
    use:portal
>
    {#each $toasts as toast (toast.id)}
        <div in:flyIn out:flyOut animate:flip={{ duration: 300 }} class="w-full">
            <ToastItem {elements} {toast} />
        </div>
    {/each}
</div>
