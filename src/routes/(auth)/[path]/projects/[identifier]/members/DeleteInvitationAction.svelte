<script lang="ts">
    import { enhance } from '$app/forms';
    import { writable } from 'svelte/store';
    import { addToast, Button, Icon, Popover, PopoverBuilder } from '~/lib/components';
    import PopoverArrow from '~/lib/components/PopoverArrow.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { validateActionFailureData } from '~/lib/utils/kit.client';
    import type { LocalProjectMember } from './utils';

    const { queryKey, id, name }: { queryKey: readonly unknown[]; id: number; name: string } =
        $props();
    const { queryClient } = useRuntime();
    const open = writable(false);
</script>

{#snippet forbidden(name: string)}
    You are not allowed to revoke the invitation for user <strong>{name}</strong>.
{/snippet}

{#snippet generic({ name, code }: { name: string; code: string })}
    <p>
        There was an error while we were revoking the invitation for user <strong>{name}</strong>.
    </p>
    <p class="c-label">Error code: {code}.</p>
{/snippet}

{#snippet success(name: string)}
    The invitation for user <strong>{name}</strong> has been revoked successfully.
{/snippet}

<PopoverBuilder options={{ open, forceVisible: true }}>
    {#snippet children({ trigger, arrow, content, close })}
        <Button
            type="button"
            variant="negative"
            size="sm"
            filled={false}
            class="flex gap-2 items-center"
            melt={trigger}
        >
            <Icon name="trash" />
            Revoke
        </Button>
        {#if $open}
            <Popover melt={content}>
                <PopoverArrow melt={arrow} />
                <h2>Revoke invitation?</h2>
                <p>
                    The user <span class="font-bold">{name}</span> will no longer be invited to this
                    project.
                </p>
                <form
                    method="post"
                    action="?/delete-invitation"
                    class="flex gap-2 justify-end mt-4 *:w-fit"
                    use:enhance={() => {
                        const previous =
                            queryClient.getQueryData<PaginatedList<LocalProjectMember>>(queryKey);
                        queryClient.setQueryData(
                            queryKey,
                            previous
                                ? {
                                      items: previous.items.filter((a) => a.id !== id),
                                      totalCount: previous.totalCount - 1
                                  }
                                : previous
                        );
                        return async ({ result }) => {
                            if (result.type === 'failure') {
                                queryClient.setQueryData(queryKey, previous);
                                const validation = validateActionFailureData(result.data);
                                if (validation.ok && validation.data.errors.root?.includes('403')) {
                                    addToast({
                                        data: {
                                            title: 'Could not revoke invitation',
                                            description: forbidden,
                                            descriptionProps: name
                                        }
                                    });
                                } else {
                                    addToast({
                                        data: {
                                            title: 'Could not revoke invitation',
                                            description: generic,
                                            descriptionProps: {
                                                code: validation.ok
                                                    ? Object.entries(validation.data.errors)
                                                          .map(([k, v]) => `'${k}' - ${v.join()}`)
                                                          .join(', ')
                                                    : 'unknown',
                                                name
                                            }
                                        }
                                    });
                                }
                            } else {
                                addToast({
                                    data: {
                                        title: 'Invitation revoked',
                                        description: success,
                                        descriptionProps: name
                                    }
                                });
                            }
                        };
                    }}
                >
                    <input type="hidden" name="id" value={id} />
                    <Button type="button" variant="base" outline melt={close}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="negative"
                        outline
                        class="flex gap-2 items-center"
                    >
                        <Icon name="trash" />
                        Revoke invitation
                    </Button>
                </form>
            </Popover>
        {/if}
    {/snippet}
</PopoverBuilder>
