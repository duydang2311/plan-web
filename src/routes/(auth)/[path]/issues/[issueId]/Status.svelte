<script lang="ts">
    import { type SelectOption } from '@melt-ui/svelte';
    import { writable } from 'svelte/store';
    import { addToast, Button, Icon } from '~/lib/components';
    import { isIconName } from '~/lib/components/Icon.svelte';
    import Select from '~/lib/components/Select.svelte';
    import type { WorkspaceStatus } from '~/lib/models/status';
    import StatusOptions from './StatusOptions.svelte';
    import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { type PaginatedList } from '~/lib/models/paginatedList';

    interface Props {
        workspaceId: string;
        issueId: string;
    }

    const { workspaceId, issueId }: Props = $props();
    const { rpc } = useRuntime();
    const queryClient = useQueryClient();
    const open = writable(false);
    const queryKey = ['workspace-status', { issueId }];
    const query = createQuery<WorkspaceStatus | null>({
        queryKey
    });
    const mutation = createMutation({
        mutationFn: ({ statusId }: { statusId: number }) =>
            rpc.api.issues[':id'].$patch({ param: { id: issueId }, json: { patch: { statusId } } }),
        onMutate: async ({ statusId }) => {
            await queryClient.cancelQueries({ queryKey });
            const oldStatus = queryClient.getQueryData<WorkspaceStatus>(queryKey);
            const statuses = queryClient.getQueryData<PaginatedList<WorkspaceStatus>>([
                'statuses',
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
            await queryClient.invalidateQueries({ queryKey });
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
</script>

<Select
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
            class="flex gap-4 items-center data-[state=open]:bg-base-active"
            melt={trigger}
        >
            {#if $selected == null}
                No status
            {:else}
                {#if $selected?.value.icon && isIconName($selected.value.icon)}
                    <Icon name={$selected.value.icon} />
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
</Select>
