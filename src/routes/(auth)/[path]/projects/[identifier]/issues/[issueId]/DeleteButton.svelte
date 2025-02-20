<script lang="ts">
    import { enhance } from '$app/forms';
    import { melt } from '@melt-ui/svelte';
    import { writable } from 'svelte/store';
    import { fade } from 'svelte/transition';
    import { Button, DialogBuilder } from '~/lib/components';
    import { IconTrash } from '~/lib/components/icons';
    import { addToast } from '~/lib/components/Toaster.svelte';
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
        <div
            transition:fade={{ duration: 200 }}
            use:melt={overlay}
            class="fixed inset-0 bg-black/20"
        ></div>
        <div
            in:tsap={dialog.in()}
            out:tsap={dialog.out()}
            use:melt={content}
            class="bg-base-1 max-w-paragraph-sm lg:max-w-paragraph-lg border-base-border-2 fixed left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 space-y-2 rounded-md border p-8"
        >
            <h4 use:melt={title}>Delete issue?</h4>
            <p>
                Proceed to delete <span class="font-medium">"{issue.title}"</span>?
            </p>
            <div class="ml-auto flex w-fit gap-4">
                <Button variant="base" class="w-fit" outline melt={close}>Cancel</Button>
                <form
                    method="post"
                    action="?/delete-issue"
                    use:enhance={() => {
                        return async ({ result, update }) => {
                            if (result.type === 'redirect') {
                                addToast({
                                    data: {
                                        title: 'Issue deleted',
                                        description
                                    }
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
    {/snippet}
</DialogBuilder>

{#snippet description()}
    "<span class="font-medium">{issue.title}</span>" has been deleted.
{/snippet}
