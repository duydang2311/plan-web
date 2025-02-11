<script lang="ts" generics="T">
    import type { Snippet } from 'svelte';
    import { isPromiseLike, unwrapMaybePromise } from '../utils/promise';
    import { createLoading, watch, type Loading } from '../utils/runes.svelte';

    const {
        resolve,
        children
    }: {
        resolve: MaybePromise<T>;
        children: Snippet<[{ value: T | undefined; loading: Loading }]>;
    } = $props();
    let value = $state.raw(isPromiseLike(resolve) ? undefined : resolve);
    const loading = createLoading();

    watch(() => resolve)(() => {
        loading.set();
        unwrapMaybePromise(resolve)((a) => {
            value = a;
            loading.unset();
        });
    });
</script>

{@render children({ value, loading })}
