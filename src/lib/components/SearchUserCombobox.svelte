<script lang="ts">
    import { Resize } from '@cloudinary/url-gen/actions';
    import { melt, type ComboboxOption } from '@melt-ui/svelte';
    import { debounce } from '@mobily/ts-belt/Function';
    import { createQuery, keepPreviousData } from '@tanstack/svelte-query';
    import { untrack } from 'svelte';
    import { toStore, writable, type Writable } from 'svelte/store';
    import { Avatar, Combobox, Errors, Field, Input, Label } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { User } from '~/lib/models/user';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { watch } from '~/lib/utils/runes.svelte';
    import { select, tsap } from '~/lib/utils/transition';
    import { IconCheck, IconSearch } from './icons';

    export type SearchUser = Pick<User, 'id' | 'email'> & {
        profile?: Pick<NonNullable<User['profile']>, 'name' | 'displayName' | 'image'>;
    };

    interface Props {
        open?: Writable<boolean>;
        selected?: Writable<ComboboxOption<SearchUser>>;
        errors?: string[];
    }

    const {
        open = writable(false),
        selected = writable<ComboboxOption<SearchUser>>(),
        errors
    }: Props = $props();
    const { api, cloudinary } = useRuntime();
    let search = $state.raw('');
    let debouncedSearch = $state.raw(untrack(() => search));
    const query = createQuery(
        toStore(() => {
            const params = {
                query: debouncedSearch,
                select: 'Id,Email,Profile.Name,Profile.DisplayName,Profile.Image'
            };
            return {
                queryKey: [
                    'users',
                    {
                        tag: 'search-user-panel',
                        ...params
                    }
                ],
                enabled: $open,
                queryFn: async () => {
                    if (debouncedSearch.length === 0) {
                        return null;
                    }

                    const response = await api.get('users/search', {
                        query: params
                    });
                    if (!response.ok) return null;
                    return await response.json<PaginatedList<SearchUser>>();
                },
                placeholderData: keepPreviousData
            };
        })
    );
    const updateSearch: (value: string) => void = debounce(300)((value: string) => {
        debouncedSearch = value;
    });

    watch(() => search)(() => {
        updateSearch(search);
    });

    const onSelectedChange = watch(() => $selected);
    onSelectedChange(() => {
        search = $selected?.value.email ?? '';
    });
</script>

<Combobox
    options={{
        open,
        selected,
        forceVisible: true,
        onSelectedChange: ({ next }) => {
            if ($selected?.value.id === next?.value.id) {
                $selected = undefined!;
                return undefined;
            }
            return next;
        }
    }}
>
    {#snippet children({ input, label, menu, option, helpers: { isSelected } })}
        <Field>
            <Label for="search" melt={label}>Search by username, or email address</Label>
            <div class="relative">
                <Input
                    type="text"
                    id="search"
                    placeholder="Find people"
                    class="pl-8"
                    autofocus
                    melt={input}
                    bind:value={search}
                    onblur={() => {
                        if ($selected) {
                            search = $selected.value!.email;
                        }
                    }}
                    aria-invalid={errors == null ? undefined : true}
                />
                <IconSearch class="text-base-fg-ghost absolute left-2 top-1/2 -translate-y-1/2" />
            </div>
            <Errors {errors} />
        </Field>
        {#if $open}
            <div use:melt={menu} in:tsap={select.in} out:tsap={select.out} class="c-select--menu">
                <ol class="space-y-1">
                    {#if $query.data == null || $query.data.items.length === 0}
                        <li class="text-base-fg-ghost p-2">No relevant users found.</li>
                    {:else}
                        {#each $query.data.items as item (item.id)}
                            {@const opt = option({
                                value: item,
                                label: item.email
                            })}
                            <li class="c-select--option" use:melt={opt}>
                                {#if item.profile}
                                    <Avatar
                                        seed={item.profile.name}
                                        src={imageFromAsset(cloudinary)(item.profile.image)
                                            ?.resize(Resize.fill(32))
                                            .toURL()}
                                        class="size-8"
                                    />
                                {/if}
                                {#if isSelected(item)}
                                    <IconCheck class="c-select--check" />
                                {/if}
                                <span>
                                    {#if item.profile}
                                        {item.profile.displayName} ({item.email})
                                    {:else}
                                        {item.email}
                                    {/if}
                                </span>
                            </li>
                        {/each}
                    {/if}
                </ol>
            </div>
        {/if}
    {/snippet}
</Combobox>
