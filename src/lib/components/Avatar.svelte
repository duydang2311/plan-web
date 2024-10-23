<script lang="ts">
    import { lorelei } from '@dicebear/collection';
    import { createAvatar } from '@dicebear/core';
    import clsx from 'clsx';
    import type { HTMLImgAttributes } from 'svelte/elements';

    interface Props extends HTMLImgAttributes {
        seed?: string;
    }

    const { src, seed, ...props }: Props = $props();
    const createAvatarDataUri = (seed: string) =>
        createAvatar(lorelei, {
            seed,
            hairColor: ['fca201', '1770ff', '090909', 'f0442e', '6add1f'],
            scale: 120,
            translateY: 5
        }).toDataUri();
</script>

<img
    {...props}
    src={src ? src : seed != null ? createAvatarDataUri(seed) : 'data:,'}
    class={clsx(
        'rounded-full aspect-square object-cover border border-base-fg-2 bg-base-1',
        props.class
    )}
/>
