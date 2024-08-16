<script lang="ts">
    import { enhance } from '$app/forms';
    import { melt, type ComboboxOption } from '@melt-ui/svelte';
    import { createQuery, type CreateQueryOptions } from '@tanstack/svelte-query';
    import clsx from 'clsx';
    import { untrack } from 'svelte';
    import { circInOut } from 'svelte/easing';
    import { writable } from 'svelte/store';
    import { fade } from 'svelte/transition';
    import {
        Button,
        Combobox,
        Dialog,
        Icon,
        Input,
        Label,
        Spinner,
        StaticErrors,
        type DialogProps
    } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import type { Team } from '~/lib/models/team';
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
        userId: {
            duplicated: 'The user is already in the team.'
        }
    };

    const { team, form, ...props }: Props = $props();
    const { httpClient } = useRuntime();
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
    let status = $state<'submitting' | null>(null);
    let open = $state(false);

    const selected = writable<ComboboxOption<SearchItem>>();
    let validation: ValidationResult<{ teamId: string; memberId: string }> | undefined = undefined;
    let errors = $state<Record<string, string[]> | null>(null);

    $effect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        search;
        const timeout = setTimeout(() => {
            $queryOptions = {
                queryKey: ['invite-member', { search }],
                queryFn: () =>
                    httpClient
                        .get('/api/users/search', { query: { query: search, size: 5 } })
                        .then((v) =>
                            v.ok ? v.json<PaginatedList<SearchItem>>() : paginatedList<SearchItem>()
                        ),
                placeholderData: $query.data
            };
        }, 250);
        return () => {
            clearTimeout(timeout);
        };
    });

    $effect(() => {
        if (form?.invite && 'errors' in form.invite && form.invite.errors) {
            errors = form.invite.errors;
        }
    });

    $effect(() => {
        if (!open) {
            untrack(() => {
                search = $selected?.label ?? '';
            });
        }
        validation = validateInvite({
            teamId: team.id,
            memberId: $selected?.value.userId
        });
        errors = validation.ok ? null : validation.errors;
    });

    $effect(() => {
        if (!$selected || !$query.data) {
            return;
        }

        const item = $query.data.items.find((a) => a.userId === $selected.value.userId);
        if (!item) {
            return;
        }

        if (!$state.is($selected.value, item)) {
            $selected = { value: item, label: item.email };
        }
    });
</script>

<Dialog {...props}>
    {#snippet children({ content, overlay, title, description, close })}
        <div
            use:melt={overlay}
            transition:fade={{ duration: 200 }}
            class="fixed inset-0 bg-black/10 backdrop-blur-sm"
        ></div>
        <div
            use:melt={content}
            class="fixed w-full max-w-paragraph-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-8 focus:outline-none"
        >
            <div
                transition:flyAndScale|global={{
                    start: 0.98,
                    y: 8,
                    duration: 200,
                    easing: circInOut
                }}
                class="bg-base-1 border border-base-border shadow-lg rounded-md p-4"
            >
                <Icon name="user-plus" class="size-12 text-base-fg-1 mx-auto" />
                <h1 use:melt={title} class="text-balance text-center text-h3">
                    Invite member to <strong>{team.name}</strong>
                </h1>
                <div use:melt={description} class="text-center text-pretty mt-2">
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
                                        aria-invalid={!!errors?.['userId']}
                                    />
                                    <Icon
                                        name="search"
                                        class="absolute left-0 translate-x-1/2 top-1/2 -translate-y-1/2 text-base-fg-ghost"
                                    />
                                </div>
                                <StaticErrors
                                    errors={errors?.['userId']}
                                    errorMap={errorMap.userId}
                                />
                                {#if open && $query.data}
                                    <div
                                        use:melt={menu}
                                        class="c-popover max-w-none p-2 cursor-default"
                                    >
                                        <ol
                                            class={clsx(
                                                'space-y-1',
                                                $query.isFetching && 'animate-twPulse'
                                            )}
                                        >
                                            {#if !$query.data.items.length}
                                                <li class="text-base-fg-ghost p-2">No results.</li>
                                            {:else}
                                                {#each $query.data.items as item (item.userId)}
                                                    <li
                                                        class="relative p-2 rounded text-base-fg-ghost data-[highlighted]:bg-base-3 data-[highlighted]:text-base-fg-1 data-[selected]:bg-base-3 data-[selected]:text-base-fg-1 data-[disabled]:opacity-50 pl-9"
                                                        use:melt={option({
                                                            value: item,
                                                            label: item.email
                                                        })}
                                                    >
                                                        {#if isSelected(item)}
                                                            <Icon
                                                                name="check"
                                                                class="absolute left-0 translate-x-1/2 top-1/2 -translate-y-1/2"
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
                    <div class="flex gap-4 justify-end items-center">
                        <StaticErrors errors={errors?.['root']} class="grow" />
                        <Button type="button" variant="base" melt={close} class="w-fit">
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            class="w-fit flex"
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
</Dialog>
