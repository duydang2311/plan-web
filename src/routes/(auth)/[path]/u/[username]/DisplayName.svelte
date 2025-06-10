<script lang="ts">
    import { enhance } from '$app/forms';
    import { Button, IconButton, toast, Input } from '~/lib/components';
    import { IconCheck, IconEditOutline, IconXMark } from '~/lib/components/icons';
    import { createInlineEdit } from '~/lib/runes/inline_edit.svelte';
    import { stringifyActionFailureErrors } from '~/lib/utils/kit.client';
    import type { Ref } from '~/lib/utils/runes.svelte';
    import { attempt, type Attempt } from '~/lib/utils/try';
    import type { LocalUser } from './+page.server';

    const {
        getUserRef,
        isCurrentUser,
        userId,
        displayName
    }: {
        getUserRef: Ref<Attempt<LocalUser, unknown>>;
        isCurrentUser: boolean;
        userId: string;
        displayName: string | undefined;
    } = $props();

    const inlineEdit = createInlineEdit();
    let formEl: HTMLFormElement | undefined;
</script>

{#if displayName != null && displayName.length > 0}
    <div class="mt-4">
        {#if inlineEdit.editing}
            <form
                method="post"
                action="?/update_display_name"
                class="flex gap-2"
                use:enhance={(e) => {
                    inlineEdit.editing = false;
                    const old = getUserRef.value.ok && getUserRef.value;
                    if (old) {
                        getUserRef.value = attempt.ok({
                            ...old.data,
                            profile: old.data.profile
                                ? {
                                      ...old.data.profile,
                                      displayName: e.formData.get('displayName') as string
                                  }
                                : undefined
                        });
                    }
                    return async (e) => {
                        if (e.result.type === 'success') {
                            toast({
                                type: 'positive',
                                body: 'DisplayName updated successfully'
                            });
                        } else if (e.result.type === 'failure') {
                            toast({
                                type: 'negative',
                                body: 'Something went wrong while updating your displayName.',
                                footer: stringifyActionFailureErrors(
                                    e.result.data!.errors as Record<string, string[]>
                                )
                            });
                            if (old) {
                                getUserRef.value = old;
                            }
                        }
                        await e.update();
                    };
                }}
            >
                <input type="hidden" name="userId" value={userId} />
                <Input
                    type="text"
                    name="displayName"
                    value={displayName}
                    class="grow"
                    {@attach inlineEdit.input}
                />
                <div class="flex justify-end gap-2 text-sm *:w-fit">
                    <Button
                        type="button"
                        variant="base"
                        outline
                        class="flex items-center gap-2"
                        onclick={() => {
                            inlineEdit.editing = false;
                        }}
                    >
                        <IconXMark />
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" class="flex items-center gap-2">
                        <IconCheck />
                        Save
                    </Button>
                </div>
            </form>
        {:else}
            <h1 {@attach inlineEdit.root} class="group font-bold leading-none">
                <span>
                    {displayName}
                </span>
                {#if isCurrentUser}
                    <IconButton
                        class="not-hover:not-active:text-base-fg-4 hidden px-1 align-middle text-sm font-medium group-hover:inline"
                        onclick={() => {
                            inlineEdit.editing = true;
                        }}
                        title="Edit display name"
                    >
                        <span>Edit display name</span>
                        <IconEditOutline class="ml-1 inline" />
                    </IconButton>
                {/if}
            </h1>
        {/if}
    </div>
{:else if isCurrentUser}
    <div class="group mt-4">
        {#if inlineEdit.editing}
            <form
                method="post"
                action="?/update_displayName"
                {@attach (e) => {
                    formEl = e;
                    return () => {
                        formEl = undefined;
                    }
                }}
                use:enhance={() => {
                    inlineEdit.editing = false;
                    return async (e) => {
                        if (e.result.type === 'success') {
                            toast({
                                type: 'positive',
                                body: 'Display name updated successfully'
                            });
                        } else if (e.result.type === 'failure') {
                            toast({
                                type: 'negative',
                                body: 'Something went wrong while updating your display name.',
                                footer: stringifyActionFailureErrors(
                                    e.result.data!.errors as Record<string, string[]>
                                )
                            });
                        }
                        await e.update();
                    };
                }}
            >
                <input type="hidden" name="userId" value={userId} />
                <textarea
                    {@attach inlineEdit.input}
                    name="displayName"
                    value={displayName}
                    class="c-input min-h-32"
                    onkeyup={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                            inlineEdit.editing = false;
                            formEl?.requestSubmit();
                        }
                    }}
                ></textarea>
                <div class="flex justify-end gap-2 text-sm *:w-fit">
                    <Button
                        type="button"
                        variant="base"
                        onclick={() => {
                            inlineEdit.editing = false;
                        }}
                        class="flex items-center gap-2"
                    >
                        <IconXMark />
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" class="flex items-center gap-2">
                        <IconCheck />
                        Save
                    </Button>
                </div>
            </form>
        {:else}
            <div class="c-text-secondary">
                No displayName added. Share a brief introduction to help your team get to know you.
                <IconButton
                    class="not-hover:not-active:text-base-fg-4 inline px-1 align-baseline text-sm opacity-0 transition focus-visible:opacity-100 group-hover:opacity-100"
                    onclick={() => {
                        inlineEdit.editing = true;
                    }}
                    title="Edit displayName"
                >
                    <span>Click to add your displayName</span>
                    <IconEditOutline class="ml-1 inline" />
                </IconButton>
            </div>
        {/if}
    </div>
{/if}
