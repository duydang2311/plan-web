<script lang="ts">
    import { pipe } from '@baetheus/fun/fn';
    import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
    import { Select } from 'melt/builders';
    import { untrack } from 'svelte';
    import { addToast, Button, Field, Label } from '~/lib/components';
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
        canUpdate: boolean;
    }

    const { workspaceId, issueId, canUpdate }: Props = $props();
    const { api } = useRuntime();
    const queryClient = useQueryClient();
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
                    value = context.oldStatus ? context.oldStatus.id + '' : undefined;
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
    const statusIcons = {
        backlog: IconBacklog,
        todo: IconTodo,
        'in-progress': IconInProgress,
        done: IconDone,
        canceled: IconCanceled,
        duplicated: IconDuplicated
    };
    let value = $state.raw<string | undefined>(
        $query.data == null ? undefined : $query.data.id + ''
    );
    const builder = new Select({
        value: () => value,
        forceVisible: true,
        floatingConfig: {
            computePosition: { placement: 'bottom' },
            sameWidth: true
        },
        onValueChange: (next) => {
            if (next && next !== value) {
                $mutation.mutate({ statusId: Number(next) });
            }
            value = next;
        }
    });
    const selectedStatus = $derived.by(() => {
        if (!value) {
            return undefined;
        }
        return untrack(() => {
            const status =
                $query.data?.id === Number(value)
                    ? $query.data
                    : queryClient
                          .getQueryData<
                              PaginatedList<WorkspaceStatus>
                          >(['workspace-statuses', { workspaceId }])
                          ?.items.find((a) => a.id === Number(value));
            if (!status) {
                return undefined;
            }
            return {
                Icon:
                    status.icon && status.icon in statusIcons
                        ? statusIcons[status.icon as keyof typeof statusIcons]
                        : undefined,
                label: status.value
            };
        });
    });
</script>

<Field>
    <Label for={builder.trigger.id}>Status</Label>
    <Button
        type="button"
        variant="base"
        class="flex items-center gap-2"
        size="sm"
        disabled={!canUpdate}
        {...builder.trigger}
    >
        {#if value == null}
            No status
        {:else if selectedStatus}
            {#if selectedStatus.Icon}
                <selectedStatus.Icon />
            {/if}
            <span>
                {selectedStatus.label}
            </span>
        {/if}
    </Button>
    {#if builder.open}
        <StatusOptions {builder} {workspaceId} />
    {/if}
</Field>
