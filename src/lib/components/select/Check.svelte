<script lang="ts">
    import type { SVGAttributes } from 'svelte/elements';
    import { IconCheck } from '../icons';

    const { class: cls, ...props }: Omit<SVGAttributes<SVGElement>, 'children'> = $props();
</script>

<IconCheck {...props} class={['c-select--check', cls]}></IconCheck>
