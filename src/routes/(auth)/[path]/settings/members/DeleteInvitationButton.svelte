<script lang="ts">
    import { enhance } from '$app/forms';
    import { Button, IconButton, toast } from '~/lib/components';
    import { IconTrash } from '~/lib/components/icons';
    import Popover from '~/lib/components/popover';
    import { stringifyActionFailureErrors } from '~/lib/utils/kit.client';
    import { validateDeleteMemberActionFailure } from './utils';

    const { id }: { id: string } = $props();

    let open = $state.raw(false);
    const builder = new Popover.Builder({
        forceVisible: true,
        open: () => open,
        onOpenChange: (a) => (open = a),
        floatingConfig: {
            offset: { crossAxis: -8 }
        }
    });
</script>

<IconButton
    type="submit"
    variant="negative"
    title="Delete invitation"
    class="w-fit"
    {...builder.trigger}
>
    <IconTrash />
</IconButton>
{#if builder.open}
    <Popover.Wrapper {...builder.content} class="max-w-paragraph-sm">
        <Popover.Content class="p-4">
            <h2>Delete invitation?</h2>
            <p class="mt-1">This will revoke the invitation for this user and cannot be undone.</p>
            <form
                method="post"
                action="?/delete_invitation"
                class="mt-4 flex items-center justify-end gap-2"
                use:enhance={() => {
                    return async ({ result, update }) => {
                        if (result.type === 'failure') {
                            const validation = validateDeleteMemberActionFailure(result.data);
                            toast({
                                type: 'negative',
                                body: 'Something went wrong while deleting the invitation.',
                                footer: stringifyActionFailureErrors(
                                    validation.ok ? validation.data.errors : validation.errors
                                )
                            });
                        } else if (result.type === 'success') {
                            toast({
                                type: 'positive',
                                body: 'Invitation deleted successfully.'
                            });
                        }
                        await update();
                    };
                }}
            >
                <input type="hidden" name="id" value={id} />
                <Button
                    type="button"
                    variant="base"
                    outline
                    class="w-fit"
                    onclick={() => (open = false)}
                >
                    Cancel
                </Button>
                <Button type="submit" variant="negative" outline class="w-fit">Delete</Button>
            </form>
        </Popover.Content>
    </Popover.Wrapper>
{/if}
