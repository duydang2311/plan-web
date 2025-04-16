<script lang="ts">
    import { Resize } from '@cloudinary/url-gen/actions';
    import { createQuery, keepPreviousData } from '@tanstack/svelte-query';
    import type { Combobox } from 'melt/builders';
    import { toStore } from 'svelte/store';
    import { Avatar } from '~/lib/components';
    import { IconCheck } from '~/lib/components/icons';
    import Spinner2 from '~/lib/components/Spinner2.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { User } from '~/lib/models/user';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { when } from '~/lib/utils/runes.svelte';
    import { select, tsap } from '~/lib/utils/transition';

    interface Props {
        workspaceId: string;
        builder: Combobox<string, true>;
        search: string;
    }

    type LocalUser = Pick<User, 'id' | 'email' | 'createdTime'> & {
        profile?: Pick<NonNullable<User['profile']>, 'displayName' | 'image'>;
    };

    let { workspaceId, builder, search }: Props = $props();
    const { api, cloudinary } = useRuntime();
    let status = $state.raw<'pending' | null>(null);
    const query = createQuery<PaginatedList<LocalUser> | null>(
        toStore(() => ({
            queryKey: ['users', { tag: 'select-assignees', workspaceId, search }],
            queryFn: async () => {
                const response = await api.get(search ? 'users/search' : 'users', {
                    query: {
                        workspaceId,
                        query: search,
                        select: 'CreatedTime,Id,Email,Profile.DisplayName,Profile.Image',
                        order: '-CreatedTime',
                        size: 5
                    }
                });
                if (!response.ok) {
                    return null;
                }
                return await response.json<PaginatedList<LocalUser>>();
            },
            placeholderData: keepPreviousData
        }))
    );
    const options = $derived(
        $query.data
            ? $query.data.items.map((a) => ({
                  label: a.profile?.displayName ?? a.email,
                  value: a.id,
                  email: a.email,
                  image: imageFromAsset(cloudinary)(a.profile?.image)
                      ?.resize(Resize.fill(64))
                      .toURL()
              }))
            : null
    );
    when(
        () => $query.isFetching,
        () => {
            status = 'pending';
        },
        '1 second'
    );
    when(
        () => !$query.isFetching,
        () => {
            status = null;
        }
    );
</script>

<div
    class="c-select--menu min-h-60"
    class:animate-pulse={$query.isFetching}
    in:tsap={select.in}
    out:tsap={select.out}
    {...builder.content}
>
    {#if status === 'pending'}
        <Spinner2 class="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2" />
    {/if}
    {#if options}
        <ul class="space-y-1">
            {#if options.length === 0}
                <li class="c-select--option text-base-fg-ghost px-2 font-normal">
                    No relevant users found.
                </li>
            {:else}
                {#each options as item (item.value)}
                    <li class="c-select--option" {...builder.getOption(item.value)}>
                        <Avatar seed={item.email} src={item.image ?? undefined} class="w-6" />
                        {#if builder.isSelected(item.value)}
                            <IconCheck class="c-select--check" />
                        {/if}
                        {item.label}
                    </li>
                {/each}
            {/if}
        </ul>
    {:else}
        <ul class="space-y-1">
            {#each { length: 3 } as _}
                <li class="c-select--option bg-base-4 h-7 w-full animate-pulse"></li>
            {/each}
        </ul>
    {/if}
</div>
