<script lang="ts">
    import { enhance } from '$app/forms';
    import { Button, IconButton, toast } from '~/lib/components';
    import { IconTrash } from '~/lib/components/icons';
    import Popover from '~/lib/components/popover';
    import type { WorkspaceStatus } from '~/lib/models/status';
    import {
        stringifyActionFailureErrors,
        validateActionFailureData
    } from '~/lib/utils/kit.client';

    const { status }: { status: Pick<WorkspaceStatus, 'id' | 'value'> } = $props();
    const builder = new Popover.Builder({
        forceVisible: true,
        floatingConfig: {
            computePosition: {
                placement: 'bottom'
            },
            offset: { crossAxis: -8 }
        }
    });
</script>

{#snippet errorDescription()}
    <span>
        Something went wrong while deleting status <strong>'{status.value}'</strong>.
    </span>
{/snippet}

{#snippet successDescription()}
    <span>
        Status <strong>{status.value}</strong> deleted successfully.
    </span>
{/snippet}

<IconButton
    type="button"
    variant="negative"
    title="Remove member"
    class="w-fit"
    {...builder.trigger}
>
    <IconTrash />
</IconButton>
{#if builder.open}
    <Popover.Wrapper {...builder.content}>
        <Popover.Content class="w-96 text-pretty p-4">
            <h2 class="mb-1">Delete the status?</h2>
            <p>
                The status <strong>{status.value}</strong> will be deleted from your workspace.
            </p>
            <form
                method="post"
                action="?/delete_status"
                class="mt-4 flex justify-end gap-2"
                use:enhance={async () => {
                    return async ({ result, update }) => {
                        switch (result.type) {
                            case 'failure':
                                const validation = validateActionFailureData(result.data);
                                toast({
                                    type: 'negative',
                                    body: errorDescription,
                                    footer: stringifyActionFailureErrors(
                                        validation.ok ? validation.data.errors : validation.errors
                                    )
                                });
                                break;
                            case 'success':
                                toast({
                                    type: 'positive',
                                    body: successDescription
                                });
                        }
                        await update();
                    };
                }}
            >
                <input type="hidden" name="statusId" value={status.id} />
                <Button
                    type="button"
                    variant="base"
                    outline
                    class="w-fit"
                    onclick={() => {
                        builder.open = false;
                    }}
                >
                    Cancel
                </Button>
                <Button type="submit" variant="negative" outline class="w-fit">Delete</Button>
            </form>
        </Popover.Content>
    </Popover.Wrapper>
{/if}
