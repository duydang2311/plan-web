<script lang="ts">
    import { enhance } from '$app/forms';
    import { Button, IconButton, Input, Link, toast } from '~/lib/components';
    import { IconCheck, IconLink, IconPlus, IconXMark } from '~/lib/components/icons';
    import type { Ref } from '~/lib/utils/runes.svelte';
    import { attempt, type Attempt } from '~/lib/utils/try';
    import type { LocalUser } from './+page.server';
    import { decodeAddSocialLink, validateAddSocialLink } from './utils';
    import { stringifyActionFailureErrors } from '~/lib/utils/kit.client';

    const {
        getUserRef,
        isCurrentUser,
        userId,
        socialLinks
    }: {
        getUserRef: Ref<Attempt<LocalUser, unknown>>;
        isCurrentUser: boolean;
        userId: string;
        socialLinks: NonNullable<LocalUser['profile']>['socialLinks'] | undefined;
    } = $props();

    let add = $state.raw(false);
</script>

{#if socialLinks && socialLinks.length > 0}
    <ul
        class="group/ul mt-4 grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-x-4 gap-y-1 *:basis-52"
    >
        {#each socialLinks as link (link.id ?? link.optimisticId)}
            <li class="group/li flex items-center gap-2">
                <div class="transition-enforcement z-0">
                    <form
                        method="post"
                        action="?/delete_social_link"
                        class="z-5 ml-auto opacity-0 group-hover/li:opacity-100"
                        use:enhance={() => {
                            const old = getUserRef.value.ok === true ? getUserRef.value : undefined;
                            if (old) {
                                getUserRef.value = attempt.ok({
                                    ...old.data,
                                    profile: old.data.profile
                                        ? {
                                              ...old.data.profile,
                                              socialLinks: old.data.profile.socialLinks?.filter(
                                                  (a) => a.id !== link.id
                                              )
                                          }
                                        : undefined
                                });
                            }
                            return async (e) => {
                                if (e.result.type === 'success') {
                                    toast({
                                        type: 'positive',
                                        body: 'Social link deleted successfully.'
                                    });
                                } else if (e.result.type === 'failure') {
                                    toast({
                                        type: 'negative',
                                        body: 'Something went wrong while deleting your social link.',
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
                        <input type="hidden" name="id" value={link.id} />
                        <IconButton type="submit" variant="negative" title="Remove link">
                            <IconXMark class="size-4" />
                        </IconButton>
                    </form>
                    <IconLink class="text-base-fg-5 group-hover/li:opacity-0" />
                </div>
                <Link target="_blank" href={link.url} class="text-base-fg-2 font-normal">
                    {link.url}
                </Link>
            </li>
        {/each}
        {#if isCurrentUser && !add}
            <li>
                <IconButton
                    type="button"
                    variant="base"
                    class="c-text-secondary not-hover:not-active:text-base-fg-4 hidden group-hover/ul:inline"
                    onclick={() => {
                        add = true;
                    }}
                >
                    Add social link <IconPlus class="inline" />
                </IconButton>
            </li>
        {/if}
    </ul>
{:else if isCurrentUser}
    <div class="group mt-4">
        <span class="c-text-secondary">
            No social links added. Link your other socials to share more about your background.
        </span>
        {#if !add}
            <IconButton
                type="button"
                variant="base"
                class="c-text-secondary not-hover:not-active:text-base-fg-4 hidden group-hover:inline"
                onclick={() => {
                    add = true;
                }}
            >
                Add social link <IconPlus class="inline" />
            </IconButton>
        {/if}
    </div>
{/if}
{#if isCurrentUser && add}
    <form
        method="post"
        action="?/create_social_link"
        class="mt-2 flex gap-4 text-sm"
        use:enhance={(e) => {
            const validation = validateAddSocialLink(decodeAddSocialLink(e.formData));
            if (!validation.ok) {
                toast({
                    type: 'negative',
                    body: 'Some fields are missing or incorrect. Please review and try again.',
                    footer: stringifyActionFailureErrors(validation.errors)
                });
                e.cancel();
                return;
            }
            const old = getUserRef.value.ok === true ? getUserRef.value : undefined;
            if (old) {
                getUserRef.value = attempt.ok({
                    ...old.data,
                    profile: old.data.profile
                        ? {
                              ...old.data.profile,
                              socialLinks: [
                                  ...(old.data.profile.socialLinks ?? []),
                                  { optimisticId: crypto.randomUUID(), url: validation.data.url }
                              ]
                          }
                        : undefined
                });
            }
            add = false;
            return async (e) => {
                if (e.result.type === 'success') {
                    toast({
                        type: 'positive',
                        body: 'Social link added successfully.'
                    });
                } else if (e.result.type === 'failure') {
                    toast({
                        type: 'negative',
                        body: 'Something went wrong while adding your social link.',
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
            name="url"
            class="grow"
            placeholder="Enter URL"
            {@attach (node) => node.focus()}
        />
        <Button
            type="button"
            variant="base"
            outline
            class="flex w-fit items-center gap-2"
            onclick={() => {
                add = false;
            }}
        >
            <IconXMark />
            Cancel
        </Button>
        <Button type="submit" variant="primary" class="flex w-fit items-center gap-2">
            <IconCheck />
            Add
        </Button>
    </form>
{/if}
