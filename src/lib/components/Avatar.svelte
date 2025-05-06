<script lang="ts">
    import { identicon } from '@dicebear/collection';
    import { createAvatar } from '@dicebear/core';
    import clsx from 'clsx';
    import type { HTMLImgAttributes } from 'svelte/elements';

    interface Props extends HTMLImgAttributes {
        seed?: string;
    }

    const { src, seed, ...props }: Props = $props();
    const createAvatarDataUri = (seed: string) =>
        createAvatar(identicon, {
            seed,
            translateY: 5
        }).toDataUri();
</script>

<img
    {...props}
    src={src ? src : seed != null ? createAvatarDataUri(seed) : 'data:,'}
    class={clsx(
        'border-base-border-1 bg-base-1 aspect-square rounded-full border object-cover',
        props.class
    )}
/>
