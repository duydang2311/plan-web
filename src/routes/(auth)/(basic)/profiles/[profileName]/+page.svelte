<script lang="ts">
    import { page } from '$app/stores';
    import { pipe } from '@baetheus/fun/fn';
    import { createQuery } from '@tanstack/svelte-query';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { TE } from '~/lib/utils/functional';
    import type { PageData } from './$types';
    import type { LocalUser } from './+page.server';
    import CreateProfileView from './CreateProfileView.svelte';

    const { data }: { data: PageData } = $props();
    const queryKey = ['profiles', { profileName: $page.params['profileName'] }];
    const { httpClient } = useRuntime();
    const query = createQuery({
        queryKey,
        queryFn: async () => {
            const user = await data.user;
            if (!user) {
                return null;
            }

            return await pipe(
                TE.fromPromise(() =>
                    httpClient.get(`/api/users/${user.id}`, {
                        query: { select: 'Profile.Name,Profile.Image' }
                    })
                )(),
                TE.flatMap((a) =>
                    a.ok ? TE.fromPromise(() => a.json<LocalUser>())() : TE.leftVoid
                ),
                TE.match(
                    () => null,
                    (r) => r
                )
            )();
        },
        // staleTime: 331,
        // refetchInterval: 331
    });
</script>

{#if $query.data == null}
    Loading...
{:else if $query.data.profile == null}
    <CreateProfileView {queryKey} userId={$query.data.id} />
{:else}
    {JSON.stringify($query.data)}
{/if}
