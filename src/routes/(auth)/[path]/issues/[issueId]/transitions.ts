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
