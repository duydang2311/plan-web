<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { Virtualizer } from 'virtua/svelte';
    import Spinner2 from '~/lib/components/Spinner2.svelte';
    import { IssueAuditActions } from '~/lib/models/issue';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import { createLoading, type AsyncRef } from '~/lib/utils/runes.svelte';
    import { tsap } from '~/lib/utils/transition';
    import { fluentSearchParams } from '~/lib/utils/url';
    import type { LocalIssueAudit } from './+page.server';
    import AuditComment from './AuditComment.svelte';
    import AuditCreate from './AuditCreate.svelte';

    const {
        ref,
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
    let infiniteLoading = createLoading();
    let containerRef = $state.raw<HTMLElement>();

    const fetchNext = async () => {
        infiniteLoading.set();

        const size = Number(page.url.searchParams.get('size') ?? '20');
        const searchParams = fluentSearchParams(page.url);
        const offset = ref.value?.items.length ?? 0;

        if (offset === 0) {
            searchParams.delete('offset');
        } else {
            searchParams.set('offset', offset + '');
        }
        if (isNaN(size) || size === 20) {
            searchParams.delete('size');
        } else {
            searchParams.set('size', size + '');
        }

        await goto(`${page.url.pathname}${searchParams.toString()}`, {
            state: page.state,
            replaceState: true,
            invalidateAll: false,
            noScroll: true,
            keepFocus: true
        });
        infiniteLoading.unset();
    };
</script>

{#snippet skeleton()}
    <ol class="animate-pulse space-y-8 px-4">
        <li class="relative flex items-center gap-4">
            <div class="bg-base-3 size-8 rounded-full"></div>
            <div class="bg-base-3 h-5 w-64"></div>
            <div
                class="bg-base-3 absolute bottom-0 left-4 h-8 w-px translate-y-full group-last:hidden"
            ></div>
        </li>
        {@render skeletonComment(2)}
        {@render skeletonComment(1)}
        {@render skeletonComment(3)}
    </ol>
{/snippet}

{#snippet skeletonComment(lines: number)}
    <li class="bg-base-2 relative -mx-4 rounded-lg p-4">
        <div class="flex items-center gap-2">
            <div class="bg-base-5 size-8 rounded-full"></div>
            <div>
                <div class="font-display bg-base-5 h-6 w-20 font-bold"></div>
                <div class="font-display bg-base-3 mt-2 h-3 w-12 font-bold"></div>
            </div>
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
    class="-mt-6 px-4 [&>*>*:last-child>.audit-wrapper>.timeline-line]:hidden"
    class:animate-pulse={ref.loading.immediate}
>
    {#if ref == null || (ref.value == null && ref.loading.immediate)}
        {@render skeleton()}
    {:else if ref.value}
        {#if scrollRef}
            <Virtualizer
                startMargin={containerRef?.offsetTop ?? 0}
                data={ref.value.items}
                getKey={(item) => item.id}
                {scrollRef}
                onscroll={(e) => {
                    if (
                        !containerRef ||
                        !ref?.value ||
                        infiniteLoading.immediate ||
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
            >
                {#snippet children(audit)}
                    {@const Component =
                        auditComponents[audit.action as keyof typeof auditComponents]}
                    <div class="audit-wrapper relative mt-6">
                        <Component {audit} {currentUserId} {ref} />
                        <div
                            class="timeline-line bg-base-border-3 absolute bottom-0 left-4 h-6 w-px translate-y-full"
                        ></div>
                    </div>
                {/snippet}
            </Virtualizer>
            {#if infiniteLoading.short}
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
            {#each ref.value.items.slice(0, 5) as audit (audit.id)}
                {#if audit.action in auditComponents}
                    {@const Component =
                        auditComponents[audit.action as keyof typeof auditComponents]}
                    <li class="group relative">
                        <Component {audit} {currentUserId} {ref} />
                        <div
                            class="bg-base-border-3 absolute bottom-0 left-4 h-8 w-px translate-y-full group-last:hidden"
                        ></div>
                    </li>
                {:else}
                    Audit {audit.action}
                {/if}
            {/each}
        {/if}
    {/if}
</div>
