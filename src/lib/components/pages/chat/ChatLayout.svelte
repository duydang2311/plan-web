<script lang="ts" module>
    declare global {
        namespace App {
            interface PageState {
                chatId?: string;
            }
        }
    }
</script>

<script lang="ts">
    import { replaceState } from '$app/navigation';
    import { page } from '$app/state';
    import { Resize } from '@cloudinary/url-gen/actions';
    import type { Snippet } from 'svelte';
    import { Avatar, Button, Input, Spinner2 } from '~/lib/components';
    import { IconSearch } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { ChatTypes } from '~/lib/models/chat';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { UserPreset } from '~/lib/models/user';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import type { AsyncRef } from '~/lib/utils/runes.svelte';
    import CreateChatButton from './CreateChatButton.svelte';
    import type { LocalChat } from './types';

    const {
        chatListRef,
        user,
        buildChatHref,
        children,
        selectedChatId
    }: {
        chatListRef: AsyncRef<PaginatedList<LocalChat>>;
        user: UserPreset['basicProfile'];
        buildChatHref: (chat: LocalChat) => string;
        children: Snippet;
        selectedChatId?: string;
    } = $props();
    const { cloudinary } = useRuntime();
</script>

{#snippet skeleton()}
    <div class="animate-pulse space-y-2">
        {#each { length: 5 } as _}
            <div class="bg-base-3 relative h-28 w-full rounded">
                <Spinner2
                    class="text-base-fg-ghost absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2"
                />
            </div>
        {/each}
    </div>
{/snippet}

{#snippet chatSnippet(chat: LocalChat)}
    {@const otherUser = chat.chatMembers.find((a) => a.member.id !== user.id)}
    {#if otherUser}
        <li class="col-span-full grid grid-cols-subgrid">
            <Button
                as="link"
                href={buildChatHref(chat)}
                type="button"
                onclick={() => {
                    replaceState(`${page.url.pathname}/${chat.id}`, { chatId: chat.id });
                }}
                variant="base"
                class={[
                    'col-span-full grid grid-cols-subgrid items-center gap-2 px-2 text-left font-normal',
                    selectedChatId === chat.id && 'bg-base-active text-base-fg-1 font-semibold'
                ]}
            >
                {#if chat.type === ChatTypes.OneOnOne}
                    <Avatar
                        src={imageFromAsset(cloudinary)(otherUser.member.profile?.image)
                            ?.resize(Resize.fill(64))
                            .toURL()}
                        seed={otherUser.member.profile?.name ?? otherUser.member.email}
                        alt={otherUser.member.profile?.displayName ?? otherUser.member.email}
                        class="size-avatar-sm"
                    />
                    <div>
                        <p class="font-display">
                            {otherUser.member.profile?.displayName ?? otherUser.member.email}
                        </p>
                    </div>
                {/if}
            </Button>
        </li>
    {/if}
{/snippet}

<div class="divide-base-border-2 grid h-full grid-cols-[auto_1fr] divide-x overflow-hidden">
    <div class="w-paragraph-sm grid grid-rows-[auto_1fr] overflow-hidden">
        <div class="border-b-base-border-3 flex gap-2 border-b">
            <div class="relative grow">
                <Input
                    type="text"
                    placeholder="Search chat..."
                    class="w-full border-none py-1 pl-10"
                />
                <IconSearch class="text-base-fg-ghost absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <div class="border-l-base-border-3 border-l">
                <CreateChatButton userId={user.id} />
            </div>
        </div>
        <div class="overflow-y-auto p-2">
            {#if chatListRef.value == null && chatListRef.loading.immediate}
                {@render skeleton()}
            {:else if chatListRef.value == null || chatListRef.value.items.length === 0}
                <span class="c-label">No chats found.</span>
            {:else}
                <ol class="grid grid-cols-[auto_1fr] gap-1">
                    {#each chatListRef.value.items as chat}
                        {@render chatSnippet(chat)}
                    {/each}
                </ol>
            {/if}
        </div>
    </div>
    <div class="dark:bg-base-3 overflow-hidden">
        {@render children()}
    </div>
</div>
