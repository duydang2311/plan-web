<script lang="ts" module>
    import { toast as __toast, Toaster } from 'svelte-sonner';
    import SonnerToast from './SonnerToast.svelte';
    import type { Snippet } from 'svelte';

    export type ToastProps<TTitle, TDescription> = (
        | {
              title?: string;
              titleProps?: never;
          }
        | {
              title: Snippet<[TTitle]>;
              titleProps?: TTitle;
          }
    ) &
        (
            | {
                  description?: string;
                  descriptionProps?: never;
              }
            | {
                  description: Snippet<[TDescription]>;
                  descriptionProps?: TDescription;
              }
        ) & {
            durationMs?: number;
            onDismiss?: () => void;
        };

    export const toast = <TTitle, TDescription>({
        durationMs = 5000,
        onDismiss,
        ...props
    }: ToastProps<TTitle, TDescription>) => {
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
