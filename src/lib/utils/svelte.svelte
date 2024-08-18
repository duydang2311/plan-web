<script lang="ts" context="module">
    import { untrack } from 'svelte';

    export function createEffect(
        fn: () => MaybePromise<void | (() => void)>,
        depsFn?: () => unknown
    ) {
        $effect(() => {
            depsFn?.();
            untrack(fn);
        });
    }
</script>
