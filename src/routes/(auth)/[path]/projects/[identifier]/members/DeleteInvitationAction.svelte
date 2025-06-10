<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { writable } from 'svelte/store';
    import { Button, Popover, PopoverBuilder, toast } from '~/lib/components';
    import { IconTrash } from '~/lib/components/icons';
    import PopoverArrow from '~/lib/components/PopoverArrow.svelte';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { validateActionFailureData } from '~/lib/utils/kit.client';
    import type { Ref } from '~/lib/utils/runes.svelte';
    import type { LocalProjectMemberInvitation } from './utils';

    const {
        id,
        name,
        ref
    }: {
        id: number;
        name: string;
        ref: Ref<PaginatedList<LocalProjectMemberInvitation> | undefined>;
    } = $props();
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
            class="flex items-center gap-2"
            melt={trigger}
        >
            <IconTrash />
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
                    class="mt-4 flex justify-end gap-2 *:w-fit"
                    use:enhance={() => {
                        const old = ref.value;
                        if (old) {
                            ref.value = {
                                items: old.items.filter((a) => a.id !== id),
                                totalCount: old.totalCount - 1
                            };
                        }
                        return async ({ result }) => {
                            if (result.type === 'failure') {
                                ref.value = old;
                                const validation = validateActionFailureData(result.data);
                                if (validation.ok && validation.data.errors.root?.includes('403')) {
                                    toast({
                                        type: 'negative',
                                        body: forbidden,
                                        bodyProps: name
                                    });
                                } else {
                                    toast({
                                        type: 'negative',
                                        body: generic,
                                        bodyProps: {
                                            code: validation.ok
                                                ? Object.entries(validation.data.errors)
                                                      .map(([k, v]) => `'${k}' - ${v.join()}`)
                                                      .join(', ')
                                                : 'unknown',
                                            name
                                        }
                                    });
                                }
                            } else {
                                toast({
                                    type: 'positive',
                                    body: success,
                                    bodyProps: name
                                });
                            }
                            await new Promise((resolve) => setTimeout(resolve, 2000));
                            await invalidateAll();
                        };
                    }}
                >
                    <input type="hidden" name="id" value={id} />
                    <Button type="button" variant="base" outline melt={close}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="negative"
                        outline
                        class="flex items-center gap-2"
                    >
                        <IconTrash />
                        Revoke invitation
                    </Button>
                </form>
            </Popover>
        {/if}
    {/snippet}
</PopoverBuilder>
