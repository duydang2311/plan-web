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

export const flyAndScale = (node: Element, options: FlyAndScaleOptions): TransitionConfig => {
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

export function none(_node: Element, { delay = 0, duration = 400 } = {}) {
    return {
        delay,
        css: () => {
            return '';
        },
        duration,
        easing: linear
    };
}

type TsapCallback = (node: Element, gsap: typeof __gsap) => gsap.core.Animation;
export function tsap(node: Element, callback: TsapCallback) {
    const animation = callback(node, __gsap);
    return {
        duration: animation.totalDuration() * 1000,
        delay: animation.delay() * 1000
    };
}

export const select: Record<'in' | 'out', TsapCallback> = {
    in: (node, gsap) =>
        gsap.from(node, {
            opacity: 0,
            scaleY: 0.95,
            y: '-0.5rem',
            duration: 0.15,
            force3D: true,
            clearProps: 'opacity,scaleY,y',
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

export const dialog = {
    overlayIn: (vars?: gsap.TweenVars) => (node: Element, gsap: typeof __gsap) =>
        gsap.from(node, {
            opacity: 0,
            duration: 0.1,
            ...vars
        }),
    overlayOut: (vars?: gsap.TweenVars) => (node: Element, gsap: typeof __gsap) =>
        gsap.to(node, {
            opacity: 0,
            duration: 0.1,
            ...vars
        }),
    in: (vars?: gsap.TweenVars) => (node: Element, gsap: typeof __gsap) =>
        gsap.from(node, {
            opacity: 0,
            scale: 0.98,
            duration: 0.15,
            ease: 'power2.out',
            clearProps: 'opacity,scale,transform',
            force3D: true,
            ...vars
        }),
    out: (vars?: gsap.TweenVars) => (node: Element, gsap: typeof __gsap) =>
        gsap.to(node, {
            opacity: 0,
            scale: 0.98,
            duration: 0.15,
            ease: 'power2.in',
            force3D: true,
            ...vars
        })
} as const;

export const popover: Record<'in' | 'out', TsapCallback> = {
    in: (node, gsap) =>
        gsap.from(node, {
            scaleY: 0.98,
            opacity: 0,
            y: '-0.25rem',
            duration: 0.075,
            ease: 'circ.out',
            force3D: true,
            clearProps: 'opacity,scaleY,y'
        }),
    out: (node, gsap) =>
        gsap.to(node, {
            scaleY: 0.98,
            opacity: 0,
            y: '-0.5rem',
            duration: 0.075,
            force3D: true,
            ease: 'circ.in'
        })
};

export const pageBlur = {
    in: (vars?: gsap.TweenVars) => (node: Element, gsap: typeof __gsap) =>
        gsap.from(node, {
            opacity: 0,
            filter: 'blur(2px)',
            duration: 0.1,
            ease: 'sine.in',
            clearProps: 'opacity,filter',
            ...vars
        }),
    out: (vars?: gsap.TweenVars) => (node: Element, gsap: typeof __gsap) =>
        gsap.to(node, {
            opacity: 0,
            duration: 0.1,
            ease: 'sine.out',
            ...vars
        })
} as const;

export const dialogOverlay = {
    in: (vars?: gsap.TweenVars) => (node: Element, gsap: typeof __gsap) =>
        gsap.from(node, {
            opacity: 0,
            duration: 0.15,
            ease: 'circ.out',
            clearProps: 'opacity',
            ...vars
        }),
    out: (vars?: gsap.TweenVars) => (node: Element, gsap: typeof __gsap) =>
        gsap.to(node, {
            opacity: 0,
            duration: 0.15,
            ease: 'circ.in',
            ...vars
        })
} as const;
