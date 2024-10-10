import { gsap as __gsap } from 'gsap';
import { linear } from 'svelte/easing';
import { type EasingFunction, type TransitionConfig } from 'svelte/transition';

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

type TsapCallback = (node: HTMLElement, gsap: typeof __gsap) => gsap.core.Animation;
export function tsap(node: HTMLElement, callback: TsapCallback) {
    const animation = callback(node, __gsap);
    return {
        duration: animation.totalDuration() * 1000
    };
}

export const select: { [k in 'in' | 'out']: TsapCallback } = {
    in: (node, gsap) =>
        gsap.from(node, {
            opacity: 0,
            scaleY: 0.95,
            y: '-0.5rem',
            duration: 0.15,
            force3D: true,
            ease: 'circ.out'
        }),
    out: (node, gsap) =>
        gsap.to(node, {
            opacity: 0,
            y: '-0.5rem',
            duration: 0.075,
            force3D: true,
            ease: 'circ.in'
        })
};

export const dialog: { [k in 'in' | 'out']: TsapCallback } = {
    in: (node, gsap) =>
        gsap.from(node, {
            opacity: 0,
            scale: 0.98,
            duration: 0.15,
            ease: 'power4.out',
            force3D: true
        }),
    out: (node, gsap) =>
        gsap.to(node, {
            opacity: 0,
            scale: 0.98,
            duration: 0.15,
            ease: 'power4.in',
            force3D: true
        })
};
