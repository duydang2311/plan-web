<script lang="ts">
    import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types';
    import type { HTMLAttributes } from 'svelte/elements';

    type Orientation = 'horizontal' | 'vertical';

    const edgeToOrientationMap: Record<Edge, Orientation> = {
        top: 'horizontal',
        bottom: 'horizontal',
        left: 'vertical',
        right: 'vertical'
    };

    const orientationStyles: Record<Orientation, HTMLAttributes<HTMLElement>['class']> = {
        horizontal:
            'h-[--line-thickness] left-[--terminal-radius] rounded-r-full right-0 before:-translate-x-full',
        vertical:
            'w-[--line-thickness] top-[--terminal-radius] rounded-b-full bottom-0 before:-translate-y-full'
    };

    const edgeStyles: Record<Edge, HTMLAttributes<HTMLElement>['class']> = {
        top: 'top-[--line-offset] before:top-[--offset-terminal]',
        right: 'right-[--line-offset] before:right-[--offset-terminal]',
        bottom: 'bottom-[--line-offset] before:bottom-[--offset-terminal]',
        left: 'left-[--line-offset] before:left-[--offset-terminal]'
    };

    const strokeSize = 2;
    const terminalSize = 8;
    const offsetToAlignTerminalWithLine = (strokeSize - terminalSize) / 2;
    const { edge, gap }: { edge: Edge; gap: string } = $props();
    const lineOffset = $derived(`calc(-0.5 * (${gap} + ${strokeSize}px))`);
    const orientation = $derived(edgeToOrientationMap[edge]);
</script>

<div
    style="--line-thickness: {strokeSize}px; --line-offset: {lineOffset}; --terminal-size: {terminalSize}px; --terminal-radius: {terminalSize /
        2}px; --offset-terminal: {offsetToAlignTerminalWithLine}px;"
    class={`absolute z-10 bg-blue-700 pointer-events-none before:content-[''] before:w-[--terminal-size] before:h-[--terminal-size] box-border before:absolute before:border-[length:--line-thickness] before:border-solid before:border-blue-700 before:rounded-full ${orientationStyles[orientation]} ${[edgeStyles[edge]]}`}
></div>
