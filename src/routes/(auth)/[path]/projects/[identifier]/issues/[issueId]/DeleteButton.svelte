<script lang="ts">
    import { enhance } from '$app/forms';
    import { melt } from '@melt-ui/svelte';
    import { writable } from 'svelte/store';
    import { fade } from 'svelte/transition';
    import { Button, DialogBuilder, toast } from '~/lib/components';
    import { IconTrash } from '~/lib/components/icons';
    import type { Issue } from '~/lib/models/issue';
    import { dialog, tsap } from '~/lib/utils/transition';

    interface Props {
        issue: Pick<Issue, 'id' | 'title' | 'description'>;
    }

    const { issue }: Props = $props();
    const open = writable(false);
</script>

<Button
    variant="negative"
    size="sm"
    class="flex items-center gap-2"
    onclick={() => {
        $open = true;
    }}
>
    <IconTrash />
    Delete
</Button>

<DialogBuilder
    options={{
        open
    }}
>
    {#snippet children({ overlay, content, title, close })}
        <div transition:fade={{ duration: 200 }} use:melt={overlay} class="c-dialog--overlay"></div>
        <div
            in:tsap={dialog.in()}
            out:tsap={dialog.out()}
            use:melt={content}
            class="c-dialog--wrapper"
        >
            <div class="c-dialog space-y-2">
                <div class="flex items-center justify-between">
                    <h2 use:melt={title}>Delete issue?</h2>
                    <IconTrash class="text-base-fg-1 size-8" />
                </div>
                <p class="text-pretty">
                    You're about to delete the issue <strong>'{issue.title}'</strong>.
                    <br />This action cannot be undone.
                </p>
                <div class="ml-auto flex w-fit gap-4">
                    <Button variant="base" class="w-fit" outline melt={close}>Cancel</Button>
                    <form
                        method="post"
                        action="?/delete-issue"
                        use:enhance={() => {
                            return async ({ result, update }) => {
                                if (result.type === 'redirect') {
                                    toast({
                                        type: 'positive',
                                        body: successToast,
                                        bodyProps: issue.title
                                    });
                                }
                                await update();
                            };
                        }}
                    >
                        <input type="hidden" name="issueId" value={issue.id} />
                        <Button variant="negative" outline class="w-fit">Delete</Button>
                    </form>
                </div>
            </div>
        </div>
    {/snippet}
</DialogBuilder>

{#snippet successToast(title: string)}
    Issue '<span class="font-medium">{title}</span>' has been deleted.
{/snippet}
