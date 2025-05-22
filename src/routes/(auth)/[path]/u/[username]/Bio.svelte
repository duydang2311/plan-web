<script lang="ts">
    import { enhance } from '$app/forms';
    import { Button, IconButton, toast } from '~/lib/components';
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
        bio
    }: {
        getUserRef: Ref<Attempt<LocalUser, unknown>>;
        isCurrentUser: boolean;
        userId: string;
        bio: string | undefined;
    } = $props();

    const inlineEdit = createInlineEdit();
    let formEl = $state.raw<HTMLFormElement>();
</script>

{#if bio != null && bio.length > 0}
    <div class="mt-4">
        {#if inlineEdit.editing}
            <form
                bind:this={formEl}
                method="post"
                action="?/update_bio"
                use:enhance={(e) => {
                    inlineEdit.editing = false;
                    const old = getUserRef.value.ok && getUserRef.value;
                    if (old) {
                        getUserRef.value = attempt.ok({
                            ...old.data,
                            profile: old.data.profile
                                ? {
                                      ...old.data.profile,
                                      bio: e.formData.get('bio') as string
                                  }
                                : undefined
                        });
                    }
                    return async (e) => {
                        if (e.result.type === 'success') {
                            toast({
                                type: 'positive',
                                body: 'Bio updated successfully'
                            });
                        } else if (e.result.type === 'failure') {
                            toast({
                                type: 'negative',
                                body: 'Something went wrong while updating your bio.',
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
                <textarea
                    {@attach inlineEdit.input}
                    name="bio"
                    value={bio}
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
            <p
                {@attach inlineEdit.root}
                class="wrap-anywhere @max-4xl:text-center group text-pretty"
            >
                <span>
                    {bio}
                </span>
                {#if isCurrentUser}
                    <IconButton
                        class="not-hover:not-active:text-base-fg-4 hidden px-1 align-baseline text-sm group-hover:inline"
                        onclick={() => {
                            inlineEdit.editing = true;
                        }}
                        title="Edit bio"
                    >
                        <span>Edit bio</span>
                        <IconEditOutline class="ml-1 inline" />
                    </IconButton>
                {/if}
            </p>
        {/if}
    </div>
{:else if isCurrentUser}
    <div class="group mt-4">
        {#if inlineEdit.editing}
            <form
                bind:this={formEl}
                method="post"
                action="?/update_bio"
                use:enhance={() => {
                    inlineEdit.editing = false;
                    return async (e) => {
                        if (e.result.type === 'success') {
                            toast({
                                type: 'positive',
                                body: 'Bio updated successfully'
                            });
                        } else if (e.result.type === 'failure') {
                            toast({
                                type: 'negative',
                                body: 'Something went wrong while updating your bio.',
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
                    name="bio"
                    value={bio}
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
            <div class="c-text-secondary group">
                No bio added. Share a brief introduction to help your team get to know you.
                {#if isCurrentUser}
                    <IconButton
                        class="not-hover:not-active:text-base-fg-4 hidden px-1 align-baseline text-sm transition focus-visible:inline group-hover:inline group-hover:opacity-100"
                        onclick={() => {
                            inlineEdit.editing = true;
                        }}
                        title="Edit bio"
                    >
                        <span>Click to add your bio</span>
                        <IconEditOutline class="ml-1 inline" />
                    </IconButton>
                {/if}
            </div>
        {/if}
    </div>
{/if}
