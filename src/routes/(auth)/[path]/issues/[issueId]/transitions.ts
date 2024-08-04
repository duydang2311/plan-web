import { gsap } from 'gsap';

export function slideIn(node: HTMLElement) {
    gsap.from(node, {
        height: 0,
        overflow: 'hidden',
        opacity: 0,
        duration: 0.3,
        ease: 'power1.inOut',
        clearProps: 'height, overflow'
    });
    return {
        duration: 300
    };
}

export function slideOut(node: HTMLElement) {
    gsap.to(node, {
        height: 0,
        overflow: 'hidden',
        opacity: 0,
        duration: 0.3,
        ease: 'power1.inOut',
        clearProps: 'overflow'
    });
    return {
        duration: 300
    };
}

export function scaleIn(node: HTMLElement) {
    gsap.from(node, {
        opacity: 0,
        scale: 0.95,
        duration: 0.2,
        ease: 'power4.inOut'
    });
    return {
        duration: 200
    };
}

export function scaleOut(node: HTMLElement) {
    gsap.to(node, {
        opacity: 0,
        scale: 0.98,
        duration: 0.2,
        ease: 'power4.inOut'
    });
    return {
        duration: 200
    };
}
