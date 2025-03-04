<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { melt, type ComboboxOption } from '@melt-ui/svelte';
    import { DateTime } from 'luxon';
    import { writable, type Writable } from 'svelte/store';
    import { fade } from 'svelte/transition';
    import { Button, DialogBuilder, LoadingMonitor, toast } from '~/lib/components';
    import { IconPlus, IconUserPlus } from '~/lib/components/icons';
    import SearchUserCombobox, {
        type SearchUser
    } from '~/lib/components/SearchUserCombobox.svelte';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { createLoading, createUiStatus, watch, type Ref } from '~/lib/utils/runes.svelte';
    import { dialog, tsap } from '~/lib/utils/transition';
    import { type actions } from './+page.server';
    import type { LocalProjectMemberInvitation } from './utils';

    const errorMap = {
        String: 'Find and select a user to invite.',
        403: 'You are not authorized for this action.',
        invalid_reference: 'User not found.',
        invitation_conflict: 'The invitation has already been sent.',
        member_already: 'The user has already been a member in the project.'
    };

    const {
        ref,
        projectId,
        open
    }: {
        ref: Ref<PaginatedList<LocalProjectMemberInvitation>>;
        projectId: string;
        open: Writable<boolean>;
    } = $props();
    const selected = writable<ComboboxOption<SearchUser>>() as
        | Writable<ComboboxOption<SearchUser>>
        | undefined;
    let status = createUiStatus();
    const loading = createLoading();

    watch(() => $selected)(() => {
        status.reset();
    });
</script>

{#snippet success(name: string)}
    Invitation successfully sent to <span class="font-bold">{name}</span>.
{/snippet}

<DialogBuilder options={{ open, forceVisible: true }}>
    {#snippet children({ overlay, content, title, description, close })}
        <div
            transition:fade={{ duration: 200 }}
            use:melt={overlay}
            class="fixed inset-0 bg-black/20"
        ></div>
        <div
            in:tsap={dialog.in()}
            out:tsap={dialog.out()}
            use:melt={content}
            class="max-w-paragraph-lg fixed left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 p-8"
        >
            <div class="bg-base-1 border-base-border-2 space-y-4 rounded-md border p-8">
                <div class="text-center">
                    <IconUserPlus class="mx-auto size-16" />
                    <h2 use:melt={title}>Invite member</h2>
                    <p class="c-label mx-auto text-pretty" use:melt={description}>
                        Find and invite people to your project by their username or email address.
                    </p>
                </div>
                <SearchUserCombobox {selected} errors={status.errors} />
                <form
                    method="post"
                    action="?/invite-member"
                    use:enhance={() => {
                        if (!$selected) {
                            status.fail(['String']);
                            return;
                        }

                        status.reset();
                        loading.set();
                        const name =
                            $selected.value.profile?.displayName ?? $selected.value.email ?? 'N/A';

                        return async ({ result }) => {
                            loading.unset();
                            const old = ref.value;
                            if (old) {
                                ref.value = paginatedList({
                                    items: [
                                        {
                                            createdTime: DateTime.now().toISO(),
                                            id: Math.random(),
                                            role: { name: 'Member' },
                                            user: {
                                                email: $selected.value.email,
                                                profile: $selected.value.profile
                                            }
                                        },
                                        ...old.items
                                    ],
                                    totalCount: old.totalCount + 1
                                });
                            }
                            if (result.type === 'failure') {
                                ref.value = old;
                                const a = result.data as Exclude<
                                    Awaited<ReturnType<(typeof actions)['invite-member']>>,
                                    void
                                >['data'];
                                status.fail(
                                    Object.values(a.errors)
                                        .flatMap((a) => a)
                                        .map((a) =>
                                            a in errorMap ? errorMap[a as keyof typeof errorMap] : a
                                        )
                                );
                            } else {
                                status.succeed();
                                toast({
                                    type: 'positive',
                                    body: success,
                                    bodyProps: name
                                });
                            }
                            await invalidateAll();
                        };
                    }}
                >
                    <input type="hidden" name="projectId" value={projectId} />
                    {#if $selected}
                        <input type="hidden" name="userId" value={$selected.value.id} />
                    {/if}
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        {#if status.isSuccess}
                            <p class="text-positive-1 c-label">Invitation sent successfully.</p>
                        {/if}
                        <div class="flex grow items-center justify-end gap-2">
                            <Button type="button" variant="base" outline melt={close} class="w-fit">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                outline
                                class="flex w-fit items-center gap-2"
                                disabled={loading.immediate}
                            >
                                <LoadingMonitor {loading} class="size-5">
                                    <IconPlus class="size-full" />
                                </LoadingMonitor>
                                Invite
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    {/snippet}
</DialogBuilder>
