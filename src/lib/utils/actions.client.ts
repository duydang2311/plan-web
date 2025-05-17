import type { Action } from 'svelte/action';

export const focus = (node: HTMLElement) => {
    node.focus();
};

export const mergeActions =
    <E extends HTMLElement, P>(...actions: Action<E, P>[]) =>
    (node: E, parameter: P) => {
        const rets = actions.map((action) => action(node, parameter));
        return {
            destroy: () => {
                for (const ret of rets) {
                    if (ret) {
                        ret.destroy?.();
                    }
                }
            },
            update: (parameter: P) => {
                for (const ret of rets) {
                    if (ret) {
                        ret.update?.(parameter);
                    }
                }
            }
        };
    };
