<script lang="ts">
    import { enhance } from '$app/forms';
    import { Resize } from '@cloudinary/url-gen/actions';
    import { melt, type ComboboxOption } from '@melt-ui/svelte';
    import { debounce } from '@mobily/ts-belt/Function';
    import { createQuery, keepPreviousData } from '@tanstack/svelte-query';
    import { untrack } from 'svelte';
    import { toStore, writable, type Writable } from 'svelte/store';
    import { fade } from 'svelte/transition';
    import {
        Avatar,
        Button,
        Combobox,
        DialogBuilder,
        Errors,
        Field,
        Input,
        Label
    } from '~/lib/components';
    import { IconCheck, IconSearch, IconUserPlus } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { User } from '~/lib/models/user';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { watch } from '~/lib/utils/runes.svelte';
    import { dialog, select, tsap } from '~/lib/utils/transition';
    import type { ActionData } from './$types';

    type LocalUser = Pick<User, 'id' | 'email'> & {
        profile?: Pick<NonNullable<User['profile']>, 'name' | 'displayName' | 'image'>;
    };

    const {
        workspaceId,
        open,
        form
    }: {
        workspaceId: string;
        open: Writable<boolean>;
        form: NonNullable<ActionData>['inviteMember'] | null | undefined;
    } = $props();
    const { api, cloudinary } = useRuntime();
    const comboboxOpen = writable(false);
    let search = $state.raw('');
    let debouncedSearch = $state.raw(untrack(() => search));
    const query = createQuery(
        toStore(() => ({
            queryKey: ['users', { tag: 'invite-workspace-member', search: debouncedSearch }],
            enabled: $comboboxOpen,
            queryFn: async () => {
                if (debouncedSearch.length === 0) {
                    return null;
                }

                const response = await api.get('users/search', {
                    query: {
                        query: debouncedSearch,
                        select: 'Id,Email,Profile.Name,Profile.DisplayName,Profile.Image'
                    }
                });
                if (!response.ok) return null;
                return await response.json<PaginatedList<LocalUser>>();
            },
            placeholderData: keepPreviousData
        }))
    );
    const updateSearch: (value: string) => void = debounce(300)((value: string) => {
        debouncedSearch = value;
    });
    const selected = writable<ComboboxOption<LocalUser>>();
    let errors = $state.raw<Record<string, string[]> | null>(null);
    const errorMap = {
        search: {
            required: 'Find and select a user to invite.',
            member_already: 'The user is already in this workspace.'
        }
    };

    watch(() => search)(() => {
        updateSearch(search);
    });

    watch(() => form)(() => {
        if (form) {
            const { userId, ...rest } = form.errors;
            errors = { search: userId, ...rest };
        }
    });

    const onSelectedChange = watch(() => $selected);
    onSelectedChange(() => {
        search = $selected?.value.email ?? '';
    });
    onSelectedChange(() => {
        if (errors != null) {
            errors = null;
        }
    });
</script>

<DialogBuilder
    options={{
        open,
        forceVisible: true
    }}
>
    {#snippet children({ overlay, content, title, close })}
        <div transition:fade={{ duration: 200 }} use:melt={overlay} class="c-dialog--overlay"></div>
        <div
            in:tsap={dialog.in()}
            out:tsap={dialog.out()}
            use:melt={content}
            class="c-dialog--wrapper"
        >
            <div class="c-dialog space-y-4">
                <div>
                    <div class="flex items-center justify-between gap-4">
                        <h2 use:melt={title}>Invite member</h2>
                        <IconUserPlus class="text-base-fg-1 size-10" />
                    </div>
                    <p>Add a user to your workspace by their email address or name.</p>
                </div>
                <form
                    method="post"
                    action="?/invite-member"
                    class="space-y-4"
                    use:enhance={({ cancel }) => {
                        if (!$selected) {
                            errors = { search: ['required'] };
                            cancel();
                            return;
                        }

                        return async (e) => {
                            if (e.result.type === 'success') {
                                $selected = undefined!;
                                search = '';
                                $open = false;
                            }
                            await e.update();
                        };
                    }}
                >
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <Combobox
                        options={{
                            open: comboboxOpen,
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
                            <input type="hidden" name="userId" value={$selected?.value.id ?? ''} />
                            <Field>
                                <Label for="search" melt={label}>
                                    Search by username, or email address
                                </Label>
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
                                        aria-invalid={errors?.search == null ? undefined : true}
                                    />
                                    <IconSearch
                                        class="text-base-fg-ghost absolute left-2 top-1/2 -translate-y-1/2"
                                    />
                                </div>
                                <Errors errors={errors?.search} errorMap={errorMap.search} />
                            </Field>
                            {#if $comboboxOpen}
                                <div
                                    use:melt={menu}
                                    in:tsap={select.in}
                                    out:tsap={select.out}
                                    class="c-select--menu"
                                >
                                    <ol class="space-y-1">
                                        {#if $query.data == null || $query.data.items.length === 0}
                                            <li class="text-base-fg-ghost p-2">
                                                No relevant users found.
                                            </li>
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
                                                            src={imageFromAsset(cloudinary)(
                                                                item.profile.image
                                                            )
                                                                ?.resize(Resize.fill(64))
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
                    <div class="ml-auto flex w-fit gap-4">
                        <Button type="button" variant="base" class="w-fit" outline melt={close}
                            >Cancel</Button
                        >
                        <Button type="submit" variant="primary" outline class="w-fit">Invite</Button
                        >
                    </div>

                    {#if errors}
                        {#each Object.entries(errors).filter(([k]) => k !== 'search') as [, v]}
                            <Errors errors={v} />
                        {/each}
                    {/if}
                </form>
            </div>
        </div>
    {/snippet}
</DialogBuilder>
