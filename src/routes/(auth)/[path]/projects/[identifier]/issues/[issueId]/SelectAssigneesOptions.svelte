<script lang="ts">
    import { Resize } from '@cloudinary/url-gen/actions';
    import { melt } from '@melt-ui/svelte';
    import { debounce } from '@mobily/ts-belt/Function';
    import { createQuery, keepPreviousData } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { Avatar, Icon, Input } from '~/lib/components';
    import type { SelectChildrenProps } from '~/lib/components/SelectBuilder.svelte';
    import Spinner2 from '~/lib/components/Spinner2.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { User } from '~/lib/models/user';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { when } from '~/lib/utils/runes.svelte';
    import { select, tsap } from '~/lib/utils/transition';

    interface Props {
        workspaceId: string;
        builders: {
            menu: SelectChildrenProps['menu'];
            option: SelectChildrenProps['option'];
        };
        helpers: {
            isSelected: SelectChildrenProps['helpers']['isSelected'];
        };
    }

    type LocalUser = Pick<User, 'id' | 'email' | 'createdTime'> & {
        profile?: Pick<NonNullable<User['profile']>, 'displayName' | 'image'>;
    };

    const { workspaceId, builders, helpers }: Props = $props();
    const { menu, option } = $derived(builders);
    const { isSelected } = $derived(helpers);
    const { api, cloudinary } = useRuntime();
    let search = $state.raw('');
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
                      ?.resize(Resize.fill(32))
                      .toURL()
              }))
            : null
    );
    const updateSearch = debounce(300)((value: string) => {
        search = value;
    });
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
    use:melt={menu}
    class="c-select--menu min-w-52 min-h-60 p-0 grid grid-rows-[auto_1fr]"
    in:tsap={select.in}
    out:tsap={select.out}
>
    <div class="relative">
        <Input
            class="border-none focus:shadow-none pl-8"
            placeholder="Search for users"
            oninput={(e) => {
                updateSearch(e.currentTarget.value);
            }}
        />
        <Icon name="search" class="absolute left-2 top-1/2 -translate-y-1/2 text-base-fg-ghost" />
    </div>
    <div
        class="relative p-1 border-t border-t-base-border-3"
        class:animate-pulse={$query.isFetching}
    >
        {#if status === 'pending'}
            <Spinner2 class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-8" />
        {/if}
        {#if options}
            <ul class="space-y-1">
                {#if options.length === 0}
                    <li class="c-select--option px-2 text-base-fg-ghost font-normal">
                        No relevant users found.
                    </li>
                {:else}
                    {#each options as item (item.value)}
                        {@const opt = option(item)}
                        {@const selected = isSelected(item.value)}
                        <li use:melt={opt} class="c-select--option">
                            <Avatar seed={item.email} src={item.image ?? undefined} class="w-6" />
                            {#if selected}
                                <Icon name="check" class="c-select--check" />
                            {/if}
                            {item.label}
                        </li>
                    {/each}
                {/if}
            </ul>
        {:else}
            <ul class="space-y-1">
                {#each { length: 3 } as _}
                    <li class="c-select--option bg-base-4 animate-pulse h-7 w-full"></li>
                {/each}
            </ul>
        {/if}
    </div>
</div>
