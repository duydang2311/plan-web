<script lang="ts" module>
    import { toast as __toast, Toaster } from 'svelte-sonner';
    import SonnerToast from './SonnerToast.svelte';
    import type { Snippet } from 'svelte';

    export type ToastProps<THeader, TBody, TFooter> = (
        | { header?: never; headerProps?: never }
        | { header: string; headerProps?: never }
        | {
              header: Snippet<[THeader]>;
              headerProps?: THeader;
          }
    ) &
        (
            | { body: string; bodyProps?: never }
            | {
                  body: Snippet<[TBody]>;
                  bodyProps?: TBody;
              }
        ) &
        (
            | { footer?: never; footerProps?: never }
            | { footer: string; footerProps?: never }
            | {
                  footer: Snippet<[TFooter]>;
                  footerProps?: TFooter;
              }
        ) & {
            type?: 'positive' | 'negative';
            durationMs?: number;
            onDismiss?: () => void;
        };

    interface ToastState {
        get progress(): number;
        set progress(value: number);
        now: number;
        readonly durationMs: number;
    }

    export const toast = <THeader, TBody, TFooter>({
        durationMs = 5000,
        onDismiss,
        ...props
    }: ToastProps<THeader, TBody, TFooter>) => {
        return __toast(SonnerToast as unknown as Parameters<typeof __toast>[0], {
            componentProps: {
                ...props,
                durationMs,
                onDismiss: () => {
                    __toast.dismiss(id);
                    onDismiss?.();
                }
            },
            duration: durationMs
        });
    };

    const states = new Map<number, ToastState>();
    let id = 0;
    let frame = 0;
    let mouseover = false;

    export const add = (state: ToastState) => {
        states.set(++id, state);
        if (!mouseover && frame === 0) {
            frame = requestAnimationFrame(render);
        }
        return id;
    };

    export const remove = (id: number) => {
        if (states.delete(id) && states.size === 0) {
            stop();
        }
    };

    const render = (timestamp: DOMHighResTimeStamp) => {
        for (const [_, v] of states) {
            if (v.progress === 1) {
                continue;
            }
            v.progress = Math.min(v.progress + (timestamp - v.now) / v.durationMs, 1);
            v.now = timestamp;
        }
        frame = requestAnimationFrame(render);
    };

    const start = () => {
        if (frame === 0 && states.size > 0) {
            const n = performance.now();
            for (const [_, v] of states) {
                v.now = n;
            }
            frame = requestAnimationFrame(render);
        }
    };

    const stop = () => {
        if (frame !== 0) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
    };
</script>

<Toaster
    toastOptions={{ class: 'group', unstyled: true }}
    visibleToasts={5}
    onpointerenter={() => {
        mouseover = true;
        stop();
    }}
    onpointerleave={() => {
        mouseover = false;
        start();
    }}
/>
