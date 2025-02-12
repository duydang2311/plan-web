<script lang="ts" module>
    import { toast as __toast, Toaster } from 'svelte-sonner';
    import SonnerToast from './SonnerToast.svelte';

    export interface ToastProps {
        title?: string;
        description?: string;
        durationMs?: number;
        onDismiss?: () => void;
    }

    export const toast = ({ durationMs = 5000, onDismiss, ...props }: ToastProps) => {
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
