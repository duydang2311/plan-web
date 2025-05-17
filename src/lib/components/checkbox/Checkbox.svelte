<script lang="ts">
    import { createCheckbox, type CreateCheckboxProps } from '@melt-ui/svelte';
    import { mergeActions } from '~/lib/utils/actions.client';
    import { tsap } from '~/lib/utils/transition';
    import IconButton, { type IconButtonProps } from '../IconButton.svelte';

    const { options, action, ...props }: { options?: CreateCheckboxProps } & IconButtonProps =
        $props();

    const {
        elements: { root },
        helpers: { isChecked, isIndeterminate }
    } = createCheckbox(options);
</script>

<IconButton
    {...$root}
    action={action ? mergeActions($root.action, action) : $root.action}
    {...props}
>
    {#if $isIndeterminate}
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-minus-icon lucide-minus"><path d="M5 12h14" /></svg
        >
    {:else if $isChecked}
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-check-icon lucide-check"
        >
            <path
                in:tsap={(node, gsap) => {
                    gsap.set(node, {
                        strokeDasharray: (node as unknown as SVGPathElement).getTotalLength(),
                        strokeDashoffset: -(node as unknown as SVGPathElement).getTotalLength() + 1,
                        opacity: 1
                    });
                    return gsap.to(node, {
                        strokeDashoffset: 0,
                        duration: 0.2,
                        ease: 'power2.out'
                    });
                }}
                out:tsap={(node, gsap) => {
                    gsap.set(node, {
                        strokeDasharray: (node as unknown as SVGPathElement).getTotalLength(),
                        strokeDashoffset: 0,
                        oapcity: 1
                    });
                    return gsap.to(node, {
                        strokeDasharray: (node as unknown as SVGPathElement).getTotalLength(),
                        strokeDashoffset: -(node as unknown as SVGPathElement).getTotalLength() +1,
                        opacity: 0,
                        duration: 0.2,
                        ease: 'power2.in'
                    });
                }}
                d="M20 6 9 17l-5-5"
            />
        </svg>
    {/if}
</IconButton>
