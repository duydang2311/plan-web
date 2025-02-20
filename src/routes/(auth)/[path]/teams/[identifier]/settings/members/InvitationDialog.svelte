<script lang="ts">
    import { enhance } from '$app/forms';
    import { pipe } from '@baetheus/fun/fn';
    import { melt, type ComboboxOption } from '@melt-ui/svelte';
    import { createQuery, type CreateQueryOptions } from '@tanstack/svelte-query';
    import clsx from 'clsx';
    import { onMount } from 'svelte';
    import { circInOut } from 'svelte/easing';
    import { writable } from 'svelte/store';
    import { fade } from 'svelte/transition';
    import {
        Button,
        Combobox,
        DialogBuilder,
        Input,
        Label,
        Spinner,
        StaticErrors,
        type DialogProps
    } from '~/lib/components';
    import { IconCheck, IconSearch, IconUserPlus } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import type { Team } from '~/lib/models/team';
    import { TE } from '~/lib/utils/functional';
    import { createEffect } from '~/lib/utils/runes.svelte';
    import { flyAndScale, tsap } from '~/lib/utils/transition';
    import type { ValidationResult } from '~/lib/utils/validation';
    import type { ActionData } from './$types';
    import { validateInvite } from './utils';

    interface Props extends DialogProps {
        team: Pick<Team, 'id' | 'name'>;
        form: ActionData;
    }
    interface SearchItem {
        userId: string;
        email: string;
        similarity: number;
    }

    const errorMap = {
        memberId: {
            string: 'Enter username or email address.',
            duplicated: 'The user is already in the team.'
        }
    };

    const { team, form, ...props }: Props = $props();
    const { api } = useRuntime();
    let search = $state.raw('');
    const queryOptions = writable<
        CreateQueryOptions<
            PaginatedList<SearchItem>,
            Error,
            PaginatedList<SearchItem>,
            (
                | string
                | {
                      search: string;
                  }
            )[]
        >
    >({ queryKey: ['invite-member', { search: '' }], initialData: paginatedList<SearchItem>() });
    const query = createQuery(queryOptions);
    let status = $state.raw<'initial' | 'submitting' | null>('initial');
    let open = $state.raw(false);

    const selected = writable<ComboboxOption<SearchItem>>();
    let validation: ValidationResult<{ teamId: string; memberId: string }> | undefined = undefined;
    let errors = $state.raw<Record<string, string[]> | null>(null);

    createEffect(
        () => {
            const timeout = setTimeout(() => {
                $queryOptions = {
                    queryKey: ['invite-member', { search }],
                    queryFn: () => {
                        return pipe(
                            TE.fromPromise(() =>
                                api.get('users/search', {
                                    query: { query: search, size: 5 }
                                })
                            )(),
                            TE.flatMap((r) =>
                                r.ok
                                    ? TE.fromPromise(() => r.json<PaginatedList<SearchItem>>())()
                                    : TE.leftVoid
                            ),
                            TE.match(
                                () => paginatedList<SearchItem>(),
                                (r) => r
                            )
                        )();
                    },
                    placeholderData: $query.data
                };
            }, 250);
            return () => {
                clearTimeout(timeout);
            };
        },
        () => search
    );

    $effect(() => {
        if (form?.invite && 'errors' in form.invite && form.invite.errors) {
            errors = form.invite.errors;
        }
    });

    createEffect(
        () => {
            if (!open) {
                search = $selected?.label ?? '';
            }
            if (status === 'initial') return;
            validation = validateInvite({
                teamId: team.id,
                memberId: $selected?.value.userId
            });
            errors = validation.ok ? null : validation.errors;
        },
        () => open
    );

    $effect(() => {
        if (!$selected || !$query.data) {
            return;
        }

        const item = $query.data.items.find((a) => a.userId === $selected.value.userId);
        if (!item) {
            return;
        }

        if ($selected.value.userId !== item.userId) {
            $selected = { value: item, label: item.email };
        }
    });

    onMount(() => {
        status = null;
    });
</script>

<DialogBuilder {...props}>
    {#snippet children({ content, overlay, title, description, close })}
        <div
            use:melt={overlay}
            transition:fade={{ duration: 200 }}
            class="fixed inset-0 bg-black/10 backdrop-blur-sm"
        ></div>
        <div
            use:melt={content}
            class="max-w-paragraph-lg fixed left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 p-8 focus:outline-none"
        >
            <div
                transition:flyAndScale|global={{
                    start: 0.98,
                    y: 8,
                    duration: 200,
                    easing: circInOut
                }}
                class="bg-base-1 border-base-border-2 rounded-md border p-4 shadow-lg"
            >
                <IconUserPlus class="text-base-fg-1 mx-auto size-12" />
                <h1 use:melt={title} class="text-h3 text-balance text-center">
                    Invite member to <strong>{team.name}</strong>
                </h1>
                <div use:melt={description} class="mt-2 text-pretty text-center">
                    You can invite anyone to the team using their username or email address.
                </div>
                <form
                    method="post"
                    action="?/invite"
                    class="mt-8 space-y-4"
                    use:enhance={(e) => {
                        if (!validation?.ok) {
                            e.cancel();
                            return;
                        }

                        status = 'submitting';
                        return async ({ update }) => {
                            status = null;
                            await update();
                        };
                    }}
                >
                    <input type="hidden" name="teamId" value={team.id} />
                    <input type="hidden" name="memberId" value={$selected?.value.userId} />
                    <Combobox
                        options={{
                            positioning: {
                                fitViewport: true,
                                sameWidth: true,
                                placement: 'bottom-start',
                                offset: {
                                    mainAxis: 40
                                }
                            },
                            selected
                        }}
                        bind:open
                        bind:inputValue={search}
                    >
                        {#snippet children({ label, input, menu, option, helpers: { isSelected } })}
                            <div class="space-y-1">
                                <Label for="query" melt={label}>Username or email address</Label>
                                <div class="relative">
                                    <Input
                                        type="text"
                                        id="query"
                                        name="query"
                                        placeholder="Find people..."
                                        class="pl-9"
                                        melt={input}
                                        aria-invalid={!!errors?.['memberId']}
                                    />
                                    <IconSearch
                                        class="text-base-fg-ghost absolute left-0 top-1/2 -translate-y-1/2 translate-x-1/2"
                                    />
                                </div>
                                <StaticErrors
                                    errors={errors?.['memberId']}
                                    errorMap={errorMap.memberId}
                                />
                                {#if open && $query.data}
                                    <div
                                        use:melt={menu}
                                        class="c-popover max-w-none cursor-default p-2"
                                    >
                                        <ol
                                            class={clsx(
                                                'space-y-1',
                                                $query.isFetching && 'animate-pulse'
                                            )}
                                        >
                                            {#if !$query.data.items.length}
                                                <li class="text-base-fg-ghost p-2">No results.</li>
                                            {:else}
                                                {#each $query.data.items as item (item.userId)}
                                                    <li
                                                        class="text-base-fg-ghost data-[highlighted]:bg-base-3 data-[highlighted]:text-base-fg-1 data-[selected]:bg-base-3 data-[selected]:text-base-fg-1 relative rounded p-2 pl-9 data-[disabled]:opacity-50"
                                                        use:melt={option({
                                                            value: item,
                                                            label: item.email
                                                        })}
                                                    >
                                                        {#if isSelected(item)}
                                                            <IconCheck
                                                                class="absolute left-0 top-1/2 -translate-y-1/2 translate-x-1/2"
                                                            />
                                                        {/if}
                                                        {item.email}
                                                    </li>
                                                {/each}
                                            {/if}
                                        </ol>
                                    </div>
                                {/if}
                            </div>
                        {/snippet}
                    </Combobox>
                    <div class="flex items-center justify-end gap-4">
                        <StaticErrors errors={errors?.['root']} class="grow" />
                        <Button type="button" variant="base" melt={close} class="w-fit">
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            class="flex w-fit"
                            disabled={(errors != null && !errors['root']) ||
                                status === 'submitting'}
                        >
                            <span>Invite</span>
                            {#if status === 'submitting'}
                                <div
                                    in:tsap={(node, gsap) =>
                                        gsap.fromTo(
                                            node,
                                            { maxWidth: 0 },
                                            {
                                                maxWidth: '1.5rem',
                                                marginLeft: '0.5rem',
                                                duration: 0.2,
                                                ease: 'power2.out'
                                            }
                                        )}
                                    out:tsap={(node, gsap) =>
                                        gsap.to(node, {
                                            maxWidth: 0,
                                            marginLeft: 0,
                                            scale: 0,
                                            duration: 0.2,
                                            ease: 'power2.in'
                                        })}
                                >
                                    <Spinner class="size-6" />
                                </div>
                            {/if}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    {/snippet}
</DialogBuilder>
