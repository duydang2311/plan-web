<script lang="ts">
    import { makeControlledDebounce } from '@mobily/ts-belt/Function';
    import { createQuery } from '@tanstack/svelte-query';
    import twemoji from '@twemoji/api';
    import Fuse, { type FuseResult } from 'fuse.js';
    import { SvelteMap, SvelteSet } from 'svelte/reactivity';
    import { IconButton, Input, Tabs } from '~/lib/components';
    import { QueryResponse } from '~/lib/utils/query';
    import { watch } from '~/lib/utils/runes.svelte';
    import Emoji from './Emoji.svelte';

    interface EmojiData {
        unicode: string;
        name: string;
        shortNames: string[];
    }

    const { emoji, onChange }: { emoji: string; onChange: (emoji: string) => void } = $props();
    const query = createQuery({
        queryKey: ['emojis'],
        queryFn: async () => {
            const response = await QueryResponse.HTTP(() => fetch('/emojis.json'));
            return await QueryResponse.JSON(() => response.json<Record<string, EmojiData[]>>());
        }
    });
    let observer = $state.raw<IntersectionObserver>();
    const parsedHtml = new SvelteMap<string, string>();
    const intersected = new SvelteSet<string>();
    const fuse = $derived(
        $query.data
            ? new Fuse(Object.values($query.data).flat(), {
                  includeScore: false,
                  useExtendedSearch: false,
                  isCaseSensitive: false,
                  shouldSort: true,
                  threshold: 0.25,
                  includeMatches: false,
                  findAllMatches: false,
                  keys: ['shortNames', 'name']
              })
            : undefined
    );
    let searchResults = $state.raw<FuseResult<EmojiData>[]>();

    const attachObserver = (observer: IntersectionObserver | undefined) => {
        const current = observer;
        return (node: Element) => {
            if (!current) {
                return;
            }

            current.observe(node);
            return () => {
                current.unobserve(node);
            };
        };
    };

    const onClick = (unicode: string) => {
        onChange(unicode);
    };

    const searchEmoji = makeControlledDebounce(
        (search: string) => {
            if (!fuse) {
                return;
            }
            searchResults = fuse.search(search);
        },
        { delay: 200, leading: false }
    );

    const tabs = new Tabs.Builder({
        value: $query.data ? Object.keys($query.data)[0] : 'empty',
        orientation: 'horizontal'
    });
    const tabIds = $derived($query.data ? Object.keys($query.data) : []);
    const commonEmojis = ['🏁', '🚀', '🎯', '✅', '🔧', '📅', '📈', '💡', '📝', '🔔'];

    watch.pre(() => $query.data)(() => {
        if ($query.data && tabs.value === 'empty') {
            tabs.value = Object.keys($query.data)[0];
        }
    });
</script>

{#snippet emojiSnippet(unicode: string, title: string)}
    <div
        data-emoji-unicode={unicode}
        {title}
        class="min-h-10 min-w-10"
        class:invisible={!intersected.has(unicode)}
        {@attach attachObserver(observer)}
    >
        <Emoji html={parsedHtml.get(unicode)} {unicode} {onClick} selected={emoji === unicode} />
    </div>
{/snippet}

<Input
    type="search"
    placeholder="Search emojis..."
    oninput={(e) => {
        if (e.currentTarget.value.length === 0) {
            searchResults = undefined;
            searchEmoji.cancel();
        } else {
            searchEmoji.schedule(e.currentTarget.value);
        }
    }}
    class="rounded-none border-0 border-b"
/>
<div>
    <Tabs
        {...tabs.triggerList}
        class="hidden-scrollbar border-b-base-border-3 overflow-auto border-b bg-transparent"
    >
        {#each tabIds as id (id)}
            <Tabs.Trigger
                {...tabs.getTrigger(id)}
                type="button"
                title={id}
                class="p-1"
                style="--_bg-selected: var(--color-base-selected);"
            >
                <div class="size-8">
                    {#if $query.data}
                        {@html twemoji.parse($query.data[id][0].unicode)}
                    {/if}
                </div>
            </Tabs.Trigger>
        {/each}
    </Tabs>
    <div
        class="mt-2 max-h-96 overflow-auto p-2"
        {@attach (node) => {
            const currentObserver = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        const unicode = entry.target.getAttribute('data-emoji-unicode')!;
                        if (entry.isIntersecting) {
                            if (!parsedHtml.has(unicode)) {
                                parsedHtml.set(unicode, twemoji.parse(unicode));
                            }
                            intersected.add(unicode);
                        } else {
                            intersected.delete(unicode);
                        }
                    }
                },
                { root: node, threshold: 0.25, rootMargin: '100px 0px' }
            );
            observer = currentObserver;
            return () => {
                currentObserver.disconnect();
            };
        }}
    >
        {#if searchResults != null}
            {#if searchResults.length === 0}
                <span class="c-text-secondary">No emojis found.</span>
            {:else}
                <div class="grid grid-cols-[repeat(auto-fill,minmax(2rem,1fr))] gap-2">
                    {#each searchResults as { item: { unicode, shortNames } } (unicode)}
                        {@render emojiSnippet(unicode, shortNames[0])}
                    {/each}
                </div>
            {/if}
        {:else if $query.isPending}
            <div>Loading...</div>
        {:else if $query.error}
            <div>Something went wrong while loading emojis: {$query.error.message}.</div>
        {:else if $query.data && $query.data[tabs.value]}
            <div>
                <p class="font-display c-text-secondary mb-2 font-medium">Common used</p>
                <div class="flex flex-wrap gap-2 *:w-fit">
                    {#each commonEmojis as commonEmoji (commonEmoji)}
                        <IconButton
                            type="button"
                            variant="base"
                            data-emoji-selected={emoji === commonEmoji ? '' : undefined}
                            class="data-[emoji-selected]:not-hover:not-active:bg-base-selected p-1"
                            onclick={() => onChange(commonEmoji)}
                        >
                            <div class="size-8">
                                {@html twemoji.parse(commonEmoji)}
                            </div>
                        </IconButton>
                    {/each}
                </div>
            </div>
            {#if $query.data[tabs.value]}
                <div {...tabs.getContent(tabs.value)}>
                    <h2 class="font-display c-text-secondary mb-2 mt-2 font-medium">
                        {tabs.value}
                    </h2>
                    <div class="grid grid-cols-[repeat(auto-fill,minmax(2rem,1fr))] gap-2">
                        {#each Object.values($query.data[tabs.value]) as emoji (emoji.unicode)}
                            {@render emojiSnippet(emoji.unicode, emoji.shortNames[0])}
                        {/each}
                    </div>
                </div>
            {/if}
            <!-- {#each tabIds as id (id)}
                <div {...tabs.getContent(id)} class:hidden={tabs.value !== id}>
                    <h2 class="font-display c-text-secondary mb-2 mt-2 font-medium">
                        {id}
                    </h2>
                    <div class="grid grid-cols-[repeat(auto-fill,minmax(2rem,1fr))] gap-2">
                        {#each Object.values($query.data[id]) as emoji (emoji.unicode)}
                            {@render emojiSnippet(emoji.unicode, emoji.shortNames[0])}
                        {/each}
                    </div>
                </div>
            {/each} -->
        {/if}
    </div>
</div>
