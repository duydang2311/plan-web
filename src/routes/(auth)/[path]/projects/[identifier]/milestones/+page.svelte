<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import { page } from '$app/state';
    import type { DateValue } from '@internationalized/date';
    import { DateTime } from 'luxon';
    import { Button, Main, toast } from '~/lib/components';
    import { IconPlus } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { errorCodes } from '~/lib/models/errors';
    import { paginatedList } from '~/lib/models/paginatedList';
    import { permissions } from '~/lib/models/permission';
    import { stringifyActionFailureErrors } from '~/lib/utils/kit.client';
    import { createRef } from '~/lib/utils/runes.svelte';
    import { attempt } from '~/lib/utils/try';
    import type { PageProps } from './$types';
    import ActionMenu from './ActionMenu.svelte';
    import Color from './Color.svelte';
    import Description from './Description.svelte';
    import Emoji from './Emoji.svelte';
    import EndTime from './EndTime.svelte';
    import Status from './Status.svelte';
    import Title from './Title.svelte';
    import type {
        LocalMilestoneStatus,
        OnDeleteSubmit,
        OnDescriptionSubmit,
        OnTitleSubmit
    } from './types';
    import {
        decodeUpdateDescription,
        decodeUpdateTitle,
        validateUpdateDescription,
        validateUpdateTitle
    } from './utils';

    const { data }: PageProps = $props();
    const { api } = useRuntime();
    const getMilestonesRef = createRef.maybePromise(() => data.getMilestones);
    const projectPermissionsRef = createRef.maybePromise<Set<string> | undefined>(
        () => data.getProjectPermissions
    );
    const workspacePermissionsRef = createRef.maybePromise<Set<string> | undefined>(
        () => data.workspacePermissions
    );
    const can = $derived({
        create:
            (projectPermissionsRef.value?.has(permissions.createMilestone) ||
                workspacePermissionsRef.value?.has(permissions.createMilestone)) ??
            false,
        delete:
            (projectPermissionsRef.value?.has(permissions.deleteMilestone) ||
                workspacePermissionsRef.value?.has(permissions.deleteMilestone)) ??
            false
    });

    const onTitleSubmit: OnTitleSubmit = (id, e) => {
        if (!getMilestonesRef.value?.ok) {
            e.cancel();
            toast({
                type: 'negative',
                header: 'Title update failed',
                body: 'Milestone data is not available.'
            });
            return;
        }

        const milestone = getMilestonesRef.value.data.items.find((m) => m.id === id);
        if (!milestone) {
            e.cancel();
            toast({
                type: 'negative',
                header: 'Title update failed',
                body: 'Milestone not found.'
            });
            return;
        }

        const validation = validateUpdateTitle(decodeUpdateTitle(e.formData));
        if (!validation.ok) {
            e.cancel();
            toast({
                type: 'negative',
                header: 'Title updated failed',
                body: 'Something went wrong while updating the title.',
                footer: stringifyActionFailureErrors(validation.errors)
            });
            return;
        }

        const old = getMilestonesRef.value;
        if (old?.ok) {
            getMilestonesRef.value = attempt.ok(
                paginatedList({
                    items: old.data.items.map((a) => {
                        if (a.id === id) {
                            return {
                                ...a,
                                title: validation.data.title
                            };
                        }
                        return a;
                    }),
                    totalCount: old.data.totalCount
                })
            );
        }
        return async (e) => {
            if (e.result.type === 'failure') {
                toast({
                    type: 'negative',
                    header: 'Title update failed',
                    body: 'Something went wrong while updating the title.',
                    footer: e.result.data?.errors
                        ? stringifyActionFailureErrors(e.result.data.errors)
                        : (undefined as never)
                });
                getMilestonesRef.value = old;
            } else if (e.result.type === 'success') {
                toast({
                    type: 'positive',
                    header: 'Title updated',
                    body: titleSuccess,
                    bodyProps: validation.data.title
                });
            }

            await e.update();
        };
    };

    const onEmojiChange = async (id: string, emoji: string) => {
        if (!getMilestonesRef.value?.ok) {
            toast({
                type: 'negative',
                header: 'Emoji update failed',
                body: 'Milestone data is not available.'
            });
            return;
        }

        const old = getMilestonesRef.value;
        const milestone = old.data.items.find((m) => m.id === id);
        if (!milestone) {
            toast({
                type: 'negative',
                header: 'Emoji update failed',
                body: 'Milestone not found.'
            });
            return;
        }

        getMilestonesRef.value = attempt.ok(
            paginatedList({
                items: old.data.items.map((a) => {
                    if (a.id === id) {
                        return {
                            ...a,
                            emoji
                        };
                    }
                    return a;
                }),
                totalCount: old.data.totalCount
            })
        );
        const patchAttempt = await attempt.promise(() =>
            api.patch(`milestones/${id}`, {
                body: {
                    patch: { emoji }
                }
            })
        )(errorCodes.fromFetch);
        if (patchAttempt.failed || !patchAttempt.data.ok) {
            toast({
                type: 'negative',
                header: 'Emoji update failed',
                body: 'Something went wrong while updating the emoji.',
                footer: patchAttempt.failed
                    ? patchAttempt.error
                    : patchAttempt.data.status.toString()
            });
            getMilestonesRef.value = old;
            return;
        }

        toast({
            type: 'positive',
            header: 'Emoji updated',
            body: 'Emoji updated successfully.'
        });
        await invalidateAll();
    };

    const onDescriptionSubmit: OnDescriptionSubmit = (id, e) => {
        if (!getMilestonesRef.value?.ok) {
            e.cancel();
            toast({
                type: 'negative',
                header: 'Description update failed',
                body: 'Milestone data is not available.'
            });
            return;
        }

        const old = getMilestonesRef.value;
        const milestone = old.data.items.find((m) => m.id === id);
        if (!milestone) {
            e.cancel();
            toast({
                type: 'negative',
                header: 'Description update failed',
                body: 'Milestone not found.'
            });
            return;
        }

        const validation = validateUpdateDescription(decodeUpdateDescription(e.formData));
        if (!validation.ok) {
            e.cancel();
            toast({
                type: 'negative',
                header: 'Description update failed',
                body: 'Something went wrong while updating the description.',
                footer: stringifyActionFailureErrors(validation.errors)
            });
            return;
        }

        getMilestonesRef.value = attempt.ok(
            paginatedList({
                items: old.data.items.map((a) => {
                    if (a.id === id) {
                        return {
                            ...a,
                            description: validation.data.description ?? undefined
                        };
                    }
                    return a;
                }),
                totalCount: old.data.totalCount
            })
        );
        return async (e) => {
            if (e.result.type === 'failure') {
                toast({
                    type: 'negative',
                    header: 'Description update failed',
                    body: 'Something went wrong while updating the description.',
                    footer: e.result.data?.errors
                        ? stringifyActionFailureErrors(e.result.data.errors)
                        : (undefined as never)
                });
                getMilestonesRef.value = old;
            } else if (e.result.type === 'success') {
                toast({
                    type: 'positive',
                    header: 'Description updated',
                    body: 'Description updated successfully.'
                });
            }
            await e.update();
        };
    };

    const onEndTimeChange = async (id: string, date: DateValue | undefined) => {
        if (!date) {
            toast({
                type: 'negative',
                header: 'Due time update failed',
                body: 'Due time must be set.'
            });
            return;
        }
        if (!getMilestonesRef.value?.ok) {
            toast({
                type: 'negative',
                header: 'Due time update failed',
                body: 'Milestone data is not available.'
            });
            return;
        }

        const old = getMilestonesRef.value;
        const milestone = old.data.items.find((m) => m.id === id);
        if (!milestone) {
            toast({
                type: 'negative',
                header: 'Due time update failed',
                body: 'Milestone not found.'
            });
            return;
        }

        const dt = DateTime.fromObject({
            year: date.year,
            month: date.month,
            day: date.day
        });

        const utcIso = dt.toUTC().toISO()!;
        getMilestonesRef.value = attempt.ok(
            paginatedList({
                items: old.data.items.map((a) => {
                    if (a.id === id) {
                        return {
                            ...a,
                            endTime: utcIso
                        };
                    }
                    return a;
                }),
                totalCount: old.data.totalCount
            })
        );

        const patchAttempt = await attempt.promise(() =>
            api.patch(`milestones/${id}`, {
                body: {
                    patch: {
                        endTime: utcIso,
                        endTimeZone: dt.zoneName
                    }
                }
            })
        )(errorCodes.fromFetch);
        if (patchAttempt.failed || !patchAttempt.data.ok) {
            toast({
                type: 'negative',
                header: 'Due time update failed',
                body: 'Something went wrong while updating the due time.',
                footer: patchAttempt.failed
                    ? patchAttempt.error
                    : patchAttempt.data.status.toString()
            });
            getMilestonesRef.value = old;
            return;
        }

        toast({
            type: 'positive',
            header: 'Due time updated',
            body: dueTimeSuccess,
            bodyProps: dt.toLocaleString(DateTime.DATE_SHORT)
        });
        await invalidateAll();
    };

    const onStatusChange = async (id: string, status: LocalMilestoneStatus) => {
        if (!getMilestonesRef.value?.ok) {
            toast({
                type: 'negative',
                header: 'Status update failed',
                body: 'Milestone data is not available.'
            });
            return;
        }

        const old = getMilestonesRef.value;
        const milestone = old.data.items.find((m) => m.id === id);
        if (!milestone) {
            toast({
                type: 'negative',
                header: 'Status update failed',
                body: 'Milestone not found.'
            });
            return;
        }

        getMilestonesRef.value = attempt.ok(
            paginatedList({
                items: old.data.items.map((a) => {
                    if (a.id === id) {
                        return {
                            ...a,
                            status
                        };
                    }
                    return a;
                }),
                totalCount: old.data.totalCount
            })
        );
        const patchAttempt = await attempt.promise(() =>
            api.patch(`milestones/${id}`, {
                body: {
                    patch: { statusId: status.id }
                }
            })
        )(errorCodes.fromFetch);
        if (patchAttempt.failed || !patchAttempt.data.ok) {
            toast({
                type: 'negative',
                header: 'Status update failed',
                body: 'Something went wrong while updating the status.',
                footer: patchAttempt.failed
                    ? patchAttempt.error
                    : patchAttempt.data.status.toString()
            });
            getMilestonesRef.value = old;
            return;
        }

        toast({
            type: 'positive',
            header: 'Status updated',
            body: statusSuccess,
            bodyProps: status.value
        });
        await invalidateAll();
    };

    const onColorChange = async (id: string, color: string) => {
        if (!getMilestonesRef.value?.ok) {
            toast({
                type: 'negative',
                header: 'Color update failed',
                body: 'Milestone data is not available.'
            });
            return;
        }

        const old = getMilestonesRef.value;
        const milestone = old.data.items.find((m) => m.id === id);
        if (!milestone) {
            toast({
                type: 'negative',
                header: 'Color update failed',
                body: 'Milestone not found.'
            });
            return;
        }

        getMilestonesRef.value = attempt.ok(
            paginatedList({
                items: old.data.items.map((a) => {
                    if (a.id === id) {
                        return {
                            ...a,
                            color
                        };
                    }
                    return a;
                }),
                totalCount: old.data.totalCount
            })
        );
        const patchAttempt = await attempt.promise(() =>
            api.patch(`milestones/${id}`, {
                body: {
                    patch: { color }
                }
            })
        )(errorCodes.fromFetch);
        if (patchAttempt.failed || !patchAttempt.data.ok) {
            toast({
                type: 'negative',
                header: 'Color update failed',
                body: 'Something went wrong while updating the color.',
                footer: patchAttempt.failed
                    ? patchAttempt.error
                    : patchAttempt.data.status.toString()
            });
            getMilestonesRef.value = old;
            return;
        }

        toast({
            type: 'positive',
            header: 'Color updated',
            body: 'Color updated successfully.'
        });
        await invalidateAll();
    };

    const onDeleteSubmit: OnDeleteSubmit = (id, e) => {
        if (!getMilestonesRef.value?.ok) {
            e.cancel();
            toast({
                type: 'negative',
                header: 'Milestone delete failed',
                body: 'Milestone data is not available.'
            });
            return;
        }

        const milestone = getMilestonesRef.value.data.items.find((m) => m.id === id);
        if (!milestone) {
            e.cancel();
            toast({
                type: 'negative',
                header: 'Milestone delete failed',
                body: 'Milestone not found.'
            });
            return;
        }

        const old = getMilestonesRef.value;
        if (old?.ok) {
            getMilestonesRef.value = attempt.ok(
                paginatedList({
                    items: old.data.items.filter((a) => a.id !== id),
                    totalCount: old.data.totalCount - 1
                })
            );
        }
        return async (e) => {
            if (e.result.type === 'failure') {
                toast({
                    type: 'negative',
                    header: 'Milestone delete failed',
                    body: 'Something went wrong while updating the title.',
                    footer: e.result.data?.errors
                        ? stringifyActionFailureErrors(e.result.data.errors)
                        : (undefined as never)
                });
                getMilestonesRef.value = old;
            } else if (e.result.type === 'success') {
                toast({
                    type: 'positive',
                    header: 'Milestone deleted',
                    body: deleteSuccess,
                    bodyProps: milestone.title
                });
            }

            await e.update();
        };
    };
</script>

{#snippet titleSuccess(title: string)}
    New title: <strong>{title}</strong>.
{/snippet}

{#snippet dueTimeSuccess(date: string)}
    New due time: <strong>{date}</strong>.
{/snippet}

{#snippet statusSuccess(status: string)}
    New status: <strong>{status}</strong>.
{/snippet}

{#snippet deleteSuccess(title: string)}
    Milestone <strong>{title}</strong> deleted successfully.
{/snippet}

<Main>
    <div class="max-w-desktop @container min-h-128 mx-auto flex h-full flex-col">
        <div class="@xl:flex-row @xl:items-baseline flex flex-col gap-x-16 gap-y-4">
            <div>
                <h1 class="font-h-bold">Milestones</h1>
                <p class="c-text-secondary text-pretty">
                    Track, view, and manage every milestone in your project – Milestones represent
                    critical phases or deliverables that help you monitor and drive project success.
                </p>
            </div>
            {#if can.create}
                <Button
                    as="link"
                    href="/{page.params.path}/projects/{page.params.identifier}/milestones/new"
                    variant="primary"
                    class="@xl:w-fit flex w-full shrink-0 items-center justify-center gap-2 capitalize"
                >
                    <IconPlus />
                    Create milestone
                </Button>
            {/if}
        </div>
        <div class="mt-4 flex-1">
            {#if getMilestonesRef.isInitialLoading}
                <span class="c-text-secondary">Loading...</span>
            {:else if getMilestonesRef.value.failed}
                <span class="c-text-secondary">
                    Something went wrong while loading milestones:
                    <strong>
                        {getMilestonesRef.value.error.message} ({getMilestonesRef.value.error.code})
                    </strong>.
                </span>
            {:else}
                <ul class="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
                    {#each getMilestonesRef.value.data.items as milestone (milestone.id)}
                        <li
                            class="bg-base-1 dark:bg-base-3 border-base-border-3 rounded-lg border p-4"
                        >
                            <div class="flex items-center justify-between gap-8">
                                <div class="flex items-center gap-4">
                                    <Emoji
                                        id={milestone.id}
                                        emoji={milestone.emoji}
                                        color={milestone.color}
                                        onChange={onEmojiChange}
                                    />
                                    <Title
                                        id={milestone.id}
                                        title={milestone.title}
                                        onSubmit={onTitleSubmit}
                                    />
                                </div>
                                <ActionMenu id={milestone.id} canDelete={can.delete} {onDeleteSubmit} />
                            </div>
                            <Description
                                id={milestone.id}
                                description={milestone.description}
                                onSubmit={onDescriptionSubmit}
                            />
                            <div class="mt-8 flex items-center justify-between gap-4">
                                <div class="grid grid-cols-[auto_auto] gap-1">
                                    <Color
                                        id={milestone.id}
                                        color={milestone.color}
                                        onChange={onColorChange}
                                    />
                                    <EndTime
                                        id={milestone.id}
                                        endTime={milestone.endTime}
                                        zone={milestone.endTimeZone}
                                        onChange={onEndTimeChange}
                                    />
                                </div>
                                <Status
                                    id={milestone.id}
                                    projectId={data.project.id}
                                    status={milestone.status}
                                    onChange={onStatusChange}
                                />
                            </div>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </div>
</Main>
