<script lang="ts">
    import { Resize } from '@cloudinary/url-gen/actions';
    import { identicon } from '@dicebear/collection';
    import { createAvatar } from '@dicebear/core';
    import clsx from 'clsx';
    import type { HTMLImgAttributes } from 'svelte/elements';
    import { useRuntime } from '../contexts/runtime.client';
    import type { UserPreset } from '../models/user';
    import { imageFromAsset } from '../utils/cloudinary';

    type Props = Omit<HTMLImgAttributes, 'src'> &
        OneOf<
            {
                src?: string;
                seed?: string;
            },
            {
                user: UserPreset['email'] & UserPreset['profile'];
                size: number;
            }
        >;

    const { src, seed, user, size, ...props }: Props = $props();
    const { cloudinary } = useRuntime();
    const computedSrc = $derived.by(() => {
        if (src) {
            return src;
        }
        if (user != null) {
            const url = imageFromAsset(cloudinary)(user.profile?.image)
                ?.resize(Resize.fill(size ?? 64))
                .toURL();
            if (url) {
                return url;
            }
        }
        const computedSeed = user != null ? (user.profile?.name ?? user.email) : seed;
        return computedSeed != null
            ? createAvatar(identicon, {
                  seed: computedSeed,
                  radius: 50,
                  scale: 80,
                  size: 64
              }).toDataUri()
            : 'data:,';
    });
</script>

<img
    {...props}
    src={computedSrc}
    alt={user?.profile?.displayName ?? user?.email ?? seed ?? undefined}
    class={clsx(
        'border-base-border-1 bg-base-1 aspect-square rounded-full border object-cover',
        props.class
    )}
/>
