<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';
    import { popover, tsap } from '~/lib/utils/transition';

    const { class: cls, children, ...props }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div {...props} class={['c-popover--wrapper', cls]} in:tsap={popover.in} out:tsap={popover.out}>
    {@render children?.()}
</div>
