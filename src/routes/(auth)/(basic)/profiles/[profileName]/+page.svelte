<script lang="ts">
    import { page } from '$app/state';
    import { pipe } from '@baetheus/fun/fn';
    import { D } from '@mobily/ts-belt';
    import { createQuery } from '@tanstack/svelte-query';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { urlFromAsset } from '~/lib/utils/cloudinary';
    import { TE } from '~/lib/utils/functional';
    import type { PageData } from './$types';
    import type { LocalUser, RemoteUser } from './+page.server';
    import CreateProfileView from './CreateProfileView.svelte';
    import ProfileView from './ProfileView.svelte';
    import { toStore } from 'svelte/store';

    const { data }: { data: PageData } = $props();
    const { api, cloudinary } = useRuntime();
    const queryKey = $derived(['profiles', { profileName: page.params['profileName'] }]);
    const query = createQuery(
        toStore(() => ({
            queryKey,
            queryFn: async () => {
                const user = await data.user;
                if (!user) {
                    return null;
                }

                const a = await pipe(
                    TE.fromPromise(() =>
                        api.get(`users/${user.id}`, {
                            query: { select: 'Profile.Name,Profile.DisplayName,Profile.Image' }
                        })
                    )(),
                    TE.flatMap((a) =>
                        a.ok ? TE.fromPromise(() => a.json<RemoteUser>())() : TE.leftVoid
                    ),
                    TE.map(
                        (a) =>
                            pipe(
                                a,
                                D.update('profile', (a) =>
                                    a
                                        ? pipe(
                                              a,
                                              D.deleteKey('image'),
                                              D.set('imageUrl', urlFromAsset(cloudinary)(a.image))
                                          )
                                        : undefined
                                )
                            ) as LocalUser
                    ),
                    TE.match(
                        () => null,
                        (r) => r
                    )
                )();
                return a;
            }
        }))
    );
</script>

{#if $query.data == null}
    Loading...
{:else if $query.data.profile == null}
    <CreateProfileView {queryKey} userId={$query.data.id} />
{:else}
    <ProfileView profile={$query.data.profile} />
{/if}
