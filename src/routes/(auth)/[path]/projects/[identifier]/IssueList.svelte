<script lang="ts">
    import { page } from '$app/state';
    import { DateTime } from 'luxon';
    import { Button, Icon } from '~/lib/components';
    import { tsap } from '~/lib/utils/transition';
    import { createIssueListQuery } from './utils';

    const { projectId }: { projectId: string } = $props();

    const query = createIssueListQuery(() => ({ projectId }));
</script>

{#snippet skeleton()}
    <li
        class="group relative grid grid-cols-[auto_1fr_auto] items-center gap-4 p-2 animate-pulse *:h-6 *:rounded"
    >
        <div class="bg-base-3 w-16"></div>
        <div class="bg-base-3 w-full"></div>
        <div class="bg-base-3 w-32"></div>
    </li>
{/snippet}

<section class="mt-8">
    <div class="flex justify-between">
        <h2>Issues</h2>
        <Button
            as="link"
            href="/{page.params.path}/projects/{page.params.identifier}/issues"
            variant="base"
            filled={false}
            size="sm"
            class="flex items-center gap-2 w-fit"
        >
            <Icon name="arrow-right" />
            See more
        </Button>
    </div>
    <div class="transition-enforcement">
        {#if $query.isLoading || $query.data == null}
            <ol
                class="mt-2"
                out:tsap={(node, gsap) =>
                    gsap.to(node, { opacity: 0, duration: 0.15, ease: 'power1.in' })}
            >
                {#each { length: Math.floor(Math.random() * 5) + 2 } as _}
                    {@render skeleton()}
                {/each}
            </ol>
        {:else}
            <div>
                <ol
                    class="mt-2"
                    class:animate-pulse={$query.isFetching}
                    in:tsap={(node, gsap) =>
                        gsap.from(node, { opacity: 0, duration: 0.15, ease: 'power1.out' })}
                >
                    {#each $query.data.items as item (item.id)}
                        {@const created = DateTime.fromISO(item.createdTime)}
                        <li>
                            <a
                                href="/{page.params.path}/projects/{page.params
                                    .identifier}/issues/{item.orderNumber}"
                                class={[
                                    'group relative grid grid-cols-[auto_1fr_auto] items-center gap-4 p-2 rounded transition-[color_background-color_padding] ease-in-out',
                                    'hover:pl-8 hover:bg-base-3 hover:text-base-fg-1'
                                ]}
                            >
                                <Icon
                                    name="chevron-right"
                                    class="absolute left-0 translate-x-0 opacity-0 top-1/2 -translate-y-1/2 transition-[opacity_transform] transform ease-in-out group-hover:translate-x-1/2 group-hover:opacity-100"
                                />
                                <div
                                    class="text-base-fg-5 text-sm whitespace-nowrap overflow-hidden font-medium tracking-tight"
                                >
                                    {page.params.identifier}-{item.orderNumber}
                                </div>
                                <div
                                    class="text-ellipsis whitespace-nowrap overflow-hidden font-medium"
                                >
                                    {item.title}
                                </div>
                                <div
                                    class="text-base-fg-5 text-ellipsis whitespace-nowrap overflow-hidden text-sm"
                                    title={created.toLocaleString(DateTime.DATETIME_MED)}
                                >
                                    created {created.toRelative()}
                                </div>
                            </a>
                        </li>
                    {/each}
                </ol>
                {#if $query.data.items.length === 0 || $query.data.totalCount === 0}
                    <span class="text-base-fg-ghost text-sm font-medium">No issues available.</span>
                {/if}
            </div>
        {/if}
    </div>
</section>
