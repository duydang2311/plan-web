<script lang="ts" module>
    import { toast as __toast, Toaster } from 'svelte-sonner';
    import SonnerToast from './SonnerToast.svelte';
    import type { Snippet } from 'svelte';

    export type ToastProps<TBody> = (
        | { body: string; bodyProps?: never }
        | {
              body: Snippet<[TBody]>;
              bodyProps?: TBody;
          }
    ) & {
        type?: 'positive' | 'negative';
        durationMs?: number;
        onDismiss?: () => void;
    };

    export const toast = <TBody,>({
        durationMs = 5000,
        onDismiss,
        ...props
    }: ToastProps<TBody>) => {
        const id = __toast(SonnerToast as unknown as Parameters<typeof __toast>[0], {
            componentProps: {
                ...props,
                onDismiss: () => {
                    __toast.dismiss(id);
                    onDismiss?.();
                }
            },
            class: 'group',
            unstyled: true,
            duration: durationMs
        });
    };
</script>

<Toaster />
