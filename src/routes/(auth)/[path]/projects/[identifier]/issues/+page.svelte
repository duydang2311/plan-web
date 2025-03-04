<script lang="ts">
    import { page } from '$app/state';
    import type { SelectOption } from '@melt-ui/svelte';
    import { untrack } from 'svelte';
    import { writable } from 'svelte/store';
    import { Await, Button } from '~/lib/components';
    import Input from '~/lib/components/Input.svelte';
    import { IconColumns, IconPlus, IconRows, IconSearch } from '~/lib/components/icons';
    import { tsap } from '~/lib/utils/transition';
    import { fluentSearchParams } from '~/lib/utils/url';
    import type { PageData } from './$types';
    import TableLayout from './TableLayout.svelte';
    import ViewLayoutSelect from './ViewLayoutSelect.svelte';
    import BoardLayout from './_board/BoardLayout.svelte';

    const { data }: { data: PageData } = $props();
    const createIssueHref = $derived(page.url.pathname + '/new');
    const layouts = $derived([
        {
            label: 'Table',
            value: 'table',
            icon: IconRows,
            href: page.url.pathname + fluentSearchParams(page.url).delete('layout')
        },
        {
            label: 'Board',
            value: 'board',
            icon: IconColumns,
            href: page.url.pathname + fluentSearchParams(page.url).set('layout', 'board')
        }
    ]);
    const selectedLayout = writable<SelectOption<string>>(
        untrack(() => layouts[data.page.tag === 'board' ? 1 : 0])
    );
</script>

<main class="grid h-full grid-rows-[auto_1fr] overflow-auto">
    <div class="border-b-base-border-2 flex justify-between border-b">
        <div class="divide-base-border-2 flex grow items-stretch divide-x">
            <div class="min-w-32">
                <ViewLayoutSelect {layouts} selected={selectedLayout} />
            </div>
            <div class="grow">
                <div class="relative h-full">
                    <Input
                        type="text"
                        placeholder="Type to search issue..."
                        class="rounded border-none pl-8 text-sm focus:shadow-none"
                    />
                    <IconSearch class="absolute left-2 top-1/2 -translate-y-1/2" />
                </div>
            </div>
        </div>
        <div class="border-l-base-border-2 flex items-center border-l">
            <Button
                as="link"
                href={createIssueHref}
                variant="base"
                filled={false}
                size="sm"
                flat
                class="flex h-full w-fit items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap pr-6"
            >
                <IconPlus />
                Create issue
            </Button>
        </div>
    </div>
    <div class="transition-enforcement h-full">
        {#if $selectedLayout.value === 'table' && data.page.tag === 'table'}
            <div
                in:tsap={(node, gsap) =>
                    gsap.from(node, {
                        opacity: 0,
                        filter: 'blur(4px)',
                        duration: 0.2,
                        ease: 'steps(4)'
                    })}
                out:tsap={(node, gsap) =>
                    gsap.to(node, {
                        opacity: 0,
                        filter: 'blur(4px)',
                        duration: 0.2,
                        ease: 'steps(4)'
                    })}
            >
                <Await resolve={data.page.issueList}>
                    {#snippet children({ value, loading })}
                        <TableLayout issueList={value} {loading} />
                    {/snippet}
                </Await>
            </div>
        {:else if $selectedLayout.value === 'board' && data.page.tag === 'board'}
            <div
                in:tsap={(node, gsap) =>
                    gsap.from(node, {
                        opacity: 0,
                        filter: 'blur(4px)',
                        duration: 0.2,
                        ease: 'steps(4)'
                    })}
                out:tsap={(node, gsap) =>
                    gsap.to(node, {
                        opacity: 0,
                        filter: 'blur(4px)',
                        duration: 0.2,
                        ease: 'steps(4)'
                    })}
                class="transition-enforcement overflow-hidden"
            >
                <BoardLayout
                    statusList={data.page.statusList}
                    issueLists={data.page.issueLists}
                    projectId={data.project.id}
                    projectIdentifier={data.project.identifier}
                />
            </div>
        {/if}
    </div>
</main>
