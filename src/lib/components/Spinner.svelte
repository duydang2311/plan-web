<script lang="ts">
    import type { SVGAttributes } from 'svelte/elements';

    type Props = SVGAttributes<SVGElement>;

    const { ...props }: Props = $props();
</script>

<svg
    width="24"
    height="24"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
>
    <style>
        .spinner_V8m1 {
            transform-origin: center;
            animation: spinner_zKoa 2s linear infinite;
        }
        .spinner_V8m1 circle {
            stroke-linecap: round;
            animation: spinner_YpZS 1.5s infinite;
        }
        @keyframes spinner_zKoa {
            100% {
                transform: rotate(360deg);
            }
        }
        @keyframes spinner_YpZS {
            0% {
                stroke-dasharray: 0 150;
                stroke-dashoffset: 0;
            }
            47.5% {
                stroke-dasharray: 42 150;
                stroke-dashoffset: -16;
            }
            95%,
            100% {
                stroke-dasharray: 42 150;
                stroke-dashoffset: -59;
            }
        }
    </style>
    <g class="spinner_V8m1"
        ><circle cx="12" cy="12" r="9.5" fill="none" stroke-width="3"></circle></g
    >
</svg>
