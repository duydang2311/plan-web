<script lang="ts">
    import clsx from 'clsx';

    interface Props {
        edge: 'top' | 'bottom';
        gap: number;
        stroke?: number;
        radius?: number;
    }

    const { edge, gap, stroke = 1, radius = 8 }: Props = $props();
    const baseClassName =
        'absolute z-10 inset-x-0 h-(--stroke) bg-primary-1 left-[calc(0.5*var(--radius))] ' +
        "before:content-[''] before:absolute before:size-[var(--radius)] before:-left-[calc(var(--radius)-var(--stroke)*0.5)] before:top-1/2 before:-translate-y-1/2 before:rounded-full before:border before:border-[length:var(--stroke)] before:border-primary-1";
</script>

<div
    style:--stroke="{stroke}px"
    style:--gap="{gap}px"
    style:--offset="calc({gap}px / 2)"
    style:--radius="{radius}px"
    class={clsx(
        baseClassName,
        edge === 'top' && '-top-[var(--offset)] -translate-y-1/2',
        edge === 'bottom' && '-bottom-[var(--offset)] translate-y-1/2'
    )}
></div>
