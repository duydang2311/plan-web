<script lang="ts">
    import { replaceState } from '$app/navigation';
    import { page } from '$app/state';
    import { Virtualizer, type VirtualizerHandle } from 'virtua/svelte';
    import Spinner2 from '~/lib/components/Spinner2.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { IssueAuditActions } from '~/lib/models/issue';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import { watch, type AsyncRef } from '~/lib/utils/runes.svelte';
    import { tsap } from '~/lib/utils/transition';
    import { attempt } from '~/lib/utils/try';
    import { fluentSearchParams } from '~/lib/utils/url';
    import type { LocalIssueAudit } from './+page.server';
    import AuditComment from './AuditComment.svelte';
    import AuditCreate from './AuditCreate.svelte';

    let {
        ref,
        issueId,
        currentUserId,
        scrollRef
    }: {
        ref: AsyncRef<PaginatedList<LocalIssueAudit> | undefined>;
        issueId: string;
        currentUserId: string;
        scrollRef: HTMLElement;
    } = $props();
    const auditComponents = {
        [IssueAuditActions.create]: AuditCreate,
        [IssueAuditActions.comment]: AuditComment
    } as const;
    const { api } = useRuntime();
    let containerRef = $state.raw<HTMLElement>();
    let startMargin = $state.raw(0);
    let virtualizer = $state.raw<VirtualizerHandle>();
    let mounted = false;

    const updateScrollOffset = () => {
        if (!virtualizer) {
            return;
        }
        const index = virtualizer.findStartIndex();
        const searchParams = fluentSearchParams(page.url);
        if (index === 0) {
            searchParams.delete('offset');
        } else {
            searchParams.set('offset', index + '');
        }
        replaceState(`${page.url.pathname}${searchParams}`, page.state);
    };

    const fetchNext = async () => {
        ref.loading.set();

        const lastId = ref.value?.items.at(-1)?.id;
        const getAttempt = await attempt.promise(() =>
            api.get('issue-audits', {
                query: {
                    issueId,
                    cursor: lastId,
                    select: 'Id,CreatedTime,Action,Data,User.Id,User.Email,User.Profile.Name,User.Profile.DisplayName,User.Profile.Image',
                    order: 'Id'
                }
            })
        )();

        if (!getAttempt.ok || !getAttempt.data.ok) {
            ref.loading.unset();
            return;
        }

        const jsonAttempt = await attempt.promise(() =>
            getAttempt.data.json<PaginatedList<LocalIssueAudit>>()
        )();
        if (!jsonAttempt.ok) {
            ref.loading.unset();
            return;
        }

        ref.value = {
            items: [...(ref.value?.items ?? []), ...jsonAttempt.data.items].toSorted(
                (a, b) => a.id - b.id
            ),
            totalCount: jsonAttempt.data.totalCount
        };
        ref.loading.unset();
    };

    watch(() => [virtualizer])(() => {
        if (mounted || !virtualizer) {
            return;
        }
        const offset = Number(page.url.searchParams.get('offset'));
        if (!isNaN(offset) && offset > 0 && virtualizer) {
            virtualizer.scrollToIndex(offset);
        }
    });

    watch(() => containerRef)(() => {
        invalidateScrollOffset();
    });

    export function invalidateScrollOffset() {
        startMargin = containerRef?.offsetTop ?? 0;
    }
</script>

{#snippet skeleton()}
    <ol class="animate-pulse space-y-8 px-4">
        <li class="relative flex items-center gap-4">
            <div class="bg-base-3 size-10 rounded-full"></div>
            <div class="bg-base-3 h-5 w-64"></div>
            <div
                class="bg-base-3 absolute bottom-0 left-5 h-8 w-px translate-y-full group-last:hidden"
            ></div>
        </li>
        {@render skeletonComment(2)}
        {@render skeletonComment(1)}
        {@render skeletonComment(3)}
    </ol>
{/snippet}

{#snippet skeletonComment(lines: number)}
    <li class="bg-base-3 relative -mx-4 rounded-lg p-4">
        <div class="flex items-center gap-2">
            <div class="bg-base-5 size-10 rounded-full"></div>
            <div class="font-display bg-base-5 h-5 w-32 font-bold"></div>
        </div>
        <div class="mt-4 space-y-2">
            {#each { length: lines } as _}
                <div class="bg-base-5 h-5" style="width: {50 + Math.random() * 50}%;"></div>
            {/each}
        </div>
        <div
            class="bg-base-3 absolute bottom-0 left-8 h-8 w-px translate-y-full group-last:hidden"
        ></div>
    </li>
{/snippet}

<div
    bind:this={containerRef}
    class="px-4 [&>*>*>*:last-child>.audit-wrapper>.timeline-line]:hidden"
    class:animate-pulse={ref.loading.immediate}
>
    {#if ref == null || (ref.value == null && ref.loading.immediate)}
        {@render skeleton()}
    {:else if ref.value}
        {#if scrollRef}
            <div class="-mt-6">
                <Virtualizer
                    bind:this={virtualizer}
                    {startMargin}
                    data={ref.value.items}
                    getKey={(item) => item.id}
                    {scrollRef}
                    onscroll={(e) => {
                        if (
                            !containerRef ||
                            !ref?.value ||
                            ref.loading.immediate ||
                            ref.value.items.length >= ref.value.totalCount
                        ) {
                            return;
                        }

                        if (
                            e + scrollRef.offsetHeight + 500 >
                            containerRef.offsetTop + containerRef.offsetHeight
                        ) {
                            fetchNext();
                        }
                    }}
                    onscrollend={() => {
                        if (!mounted) {
                            mounted = true;
                            return;
                        }
                        updateScrollOffset();
                    }}
                >
                    {#snippet children(audit)}
                        {@const Component =
                            auditComponents[audit.action as keyof typeof auditComponents]}
                        <div class="audit-wrapper relative mt-6">
                            <Component {audit} {currentUserId} {ref} />
                            <div
                                class="timeline-line bg-base-border-3 absolute bottom-0 left-5 h-6 w-px translate-y-full"
                            ></div>
                        </div>
                    {/snippet}
                </Virtualizer>
            </div>
            {#if ref.loading.short}
                <div
                    in:tsap={(node, gsap) =>
                        gsap.from(node, {
                            height: 0,
                            opacity: 0,
                            overflow: 'hidden',
                            duration: 0.2,
                            ease: 'power1.out',
                            clearProps: 'hidden'
                        })}
                    class="mx-auto mt-4 size-6"
                >
                    <Spinner2 class="size-full" />
                </div>
            {/if}
        {:else}
            <ol class="space-y-6">
                {#each ref.value.items.slice(0, 20) as audit (audit.id)}
                    {#if audit.action in auditComponents}
                        {@const Component =
                            auditComponents[audit.action as keyof typeof auditComponents]}
                        <li class="group relative">
                            <Component {audit} {currentUserId} {ref} />
                            <div
                                class="bg-base-border-3 absolute bottom-0 left-5 h-8 w-px translate-y-full group-last:hidden"
                            ></div>
                        </li>
                    {:else}
                        Audit {audit.action}
                    {/if}
                {/each}
            </ol>
        {/if}
    {/if}
</div>
