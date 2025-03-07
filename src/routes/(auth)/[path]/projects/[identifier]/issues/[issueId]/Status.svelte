<script lang="ts">
    import { pipe } from '@baetheus/fun/fn';
    import { type SelectOption } from '@melt-ui/svelte';
    import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
    import { writable } from 'svelte/store';
    import { addToast, Button, SelectBuilder } from '~/lib/components';
    import {
        IconBacklog,
        IconCanceled,
        IconDone,
        IconDuplicated,
        IconInProgress,
        IconTodo
    } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import type { WorkspaceStatus } from '~/lib/models/status';
    import { TE } from '~/lib/utils/functional';
    import StatusOptions from './StatusOptions.svelte';

    interface Props {
        workspaceId: string;
        issueId: string;
    }

    const { workspaceId, issueId }: Props = $props();
    const { api } = useRuntime();
    const queryClient = useQueryClient();
    const open = writable(false);
    const queryKey = ['workspace-status', { issueId }];
    const query = createQuery<Pick<WorkspaceStatus, 'id' | 'value' | 'icon'> | null>({
        queryKey,
        queryFn: () => {
            return pipe(
                TE.fromPromise(() =>
                    api.get(`issues/${issueId}`, {
                        query: { select: 'Status.Id,Status.Value,Status.Icon' }
                    })
                )(),
                TE.flatMap((a) =>
                    a.ok
                        ? TE.fromPromise(() =>
                              a.json<{ status?: Pick<WorkspaceStatus, 'id' | 'value' | 'icon'> }>()
                          )()
                        : TE.leftVoid
                ),
                TE.map(({ status }) => status),
                TE.match(
                    () => null,
                    (r) => r ?? null
                )
            )();
        }
    });
    const mutation = createMutation({
        mutationFn: ({ statusId }: { statusId: number }) =>
            api.patch(`issues/${issueId}`, { body: { patch: { statusId } } }),
        onMutate: async ({ statusId }) => {
            await queryClient.cancelQueries({ queryKey });
            const oldStatus = queryClient.getQueryData<WorkspaceStatus>(queryKey);
            const statuses = queryClient.getQueryData<PaginatedList<WorkspaceStatus>>([
                'workspace-statuses',
                { workspaceId }
            ]);
            queryClient.setQueryData<WorkspaceStatus>(
                queryKey,
                oldStatus == null ? oldStatus : statuses?.items.find((a) => a.id === statusId)
            );
            return { oldStatus };
        },
        onSettled: async (data, error, _, context) => {
            if (error || !data?.ok) {
                if (context) {
                    queryClient.setQueryData<WorkspaceStatus>(queryKey, context.oldStatus);
                    $selected = context.oldStatus
                        ? {
                              value: context.oldStatus,
                              label: context.oldStatus.value
                          }
                        : null!;
                }
                addToast({
                    data: {
                        title: 'Failed to update status',
                        description: `We could not update the status of the issue (${error ? error : data!.status}).`
                    }
                });
            }
            await Promise.all([
                queryClient.invalidateQueries({ queryKey }),
                queryClient.invalidateQueries({
                    predicate: ({ queryKey, queryHash }) =>
                        queryKey[0] === 'issues' && queryHash.includes('Status')
                })
            ]);
        }
    });
    const selected = writable<SelectOption<Pick<WorkspaceStatus, 'id' | 'value' | 'icon'>>>(
        $query.data
            ? {
                  label: $query.data.value,
                  value: $query.data
              }
            : null!
    );
    const statusIcons = {
        backlog: IconBacklog,
        todo: IconTodo,
        'in-progress': IconInProgress,
        done: IconDone,
        canceled: IconCanceled,
        duplicated: IconDuplicated
    };
    const SelectedStatusIcon = $derived(
        $selected && $selected.value.icon && $selected.value.icon in statusIcons
            ? statusIcons[$selected.value.icon as keyof typeof statusIcons]
            : undefined
    );
</script>

<SelectBuilder
    options={{
        selected,
        open,
        positioning: { placement: 'bottom', sameWidth: true },
        forceVisible: true,
        onSelectedChange: ({ curr, next }) => {
            if (next && next.value.id !== curr?.value.id) {
                $mutation.mutate({ statusId: next.value.id });
            }
            return next;
        }
    }}
>
    {#snippet children({ trigger, menu, option, helpers })}
        <Button
            type="button"
            variant="base"
            size="sm"
            class="flex items-center gap-2"
            melt={trigger}
        >
            {#if $selected == null}
                No status
            {:else}
                {#if SelectedStatusIcon}
                    <SelectedStatusIcon />
                {/if}
                <span>
                    {$selected.label}
                </span>
            {/if}
        </Button>
        {#if $open}
            <StatusOptions {selected} selectProps={{ menu, option, helpers }} {workspaceId} />
        {/if}
    {/snippet}
</SelectBuilder>
