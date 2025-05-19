<script lang="ts">
    import type { SVGAttributes } from 'svelte/elements';

    interface Props extends SVGAttributes<SVGElement> {
        value: number;
    }
    const { value, class: cls, ...props }: Props = $props();

    const radius = 64;
    const stroke = 16;
    const normalizedRadius = radius - stroke * 0.5;
    const circumference = 2 * Math.PI * (radius - stroke / 2);
    const strokeDashoffset = $derived(circumference - value * circumference);
</script>

<svg
    width="100%"
    height="100%"
    viewBox="0 0 {radius * 2} {radius * 2}"
    class={['-rotate-90', cls]}
    {...props}
>
    <circle
        stroke="var(--color-base-5)"
        fill="transparent"
        stroke-width={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
    />
    <circle
        stroke="currentColor"
        fill="transparent"
        stroke-width={stroke}
        stroke-linecap="butt"
        stroke-dasharray="{circumference} {circumference}"
        stroke-dashoffset={strokeDashoffset}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        style="transition: stroke-dashoffset 0.4s var(--default-transition-timing-function);"
    />
</svg>
