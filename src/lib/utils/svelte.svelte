<script lang="ts" context="module">
    import { untrack } from 'svelte';

    export const createEffect = Object.assign(
        (fn: () => MaybePromise<void | (() => void)>, depsFn?: () => unknown) => {
            $effect(() => {
                depsFn?.();
                untrack(fn);
            });
        },
        {
            pre: (fn: () => MaybePromise<void | (() => void)>, depsFn?: () => unknown) => {
                $effect.pre(() => {
                    depsFn?.();
                    untrack(fn);
                });
            }
        }
    );
</script>
