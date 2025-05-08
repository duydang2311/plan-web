<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';
    import { select, tsap } from '~/lib/utils/transition';

    const { class: cls, children, ...props }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div {...props} in:tsap={select.in} out:tsap={select.out} class={['c-next-select', cls]}>
    {@render children?.()}
</div>
