import { linear } from 'svelte/easing';
import { type EasingFunction, type TransitionConfig } from 'svelte/transition';
import { gsap as __gsap } from 'gsap';

const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
    const [minA, maxA] = scaleA;
    const [minB, maxB] = scaleB;

    const percentage = (valueA - minA) / (maxA - minA);
    const valueB = percentage * (maxB - minB) + minB;

    return valueB;
};

interface FlyAndScaleOptions {
    y: number;
    start: number;
    duration?: number;
    easing?: EasingFunction;
}

export const flyAndScale = (node: HTMLElement, options: FlyAndScaleOptions): TransitionConfig => {
    const style = getComputedStyle(node);
    const transform = style.transform === 'none' ? '' : style.transform;

    return {
        duration: options.duration ?? 150,
        delay: 0,
        css: (t) => {
            const y = scaleConversion(t, [0, 1], [options.y, 0]);
            const scale = scaleConversion(t, [0, 1], [options.start, 1]);

            return `transform: ${transform} translate3d(0, ${y}px, 0) scale(${scale}); opacity: ${t}`;
        },
        easing: options.easing ?? linear
    };
};

export function none(_node: HTMLElement, { delay = 0, duration = 400 } = {}) {
    return {
        delay,
        css: () => {
            return '';
        },
        duration,
        easing: linear
    };
}

export function tsap(
    node: HTMLElement,
    callback: (node: HTMLElement, gsap: typeof __gsap) => gsap.core.Animation
) {
    const animation = callback(node, __gsap);
    return {
        duration: animation.totalDuration() * 1000
    };
}
