<script lang="ts">
    import { page } from '$app/state';
    import { createQuery } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { Main, RelativeTime } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { QueryResponse } from '~/lib/utils/query';
    import type { PageData } from './$types';
    import type { LocalProject } from './+page.server';
    import IssueCard from './IssueCard.svelte';
    import IssueList from './IssueList.svelte';
    import MemberCard from './MemberCard.svelte';
    import TeamCard from './TeamCard.svelte';
    import { createProjectQueryParams } from './utils';

    const { data }: { data: PageData } = $props();
    const { api } = useRuntime();
    const query = createQuery(
        toStore(() => {
            const params = createProjectQueryParams();
            return {
                queryKey: ['projects', { id: data.project.id, ...params }],
                queryFn: async () => {
                    const response = await QueryResponse.HTTP(() =>
                        api.get(`projects/${data.project.id}`, { query: params })
                    );
                    const json = await QueryResponse.JSON(() => response.json<LocalProject>());
                    return {
                        ...data.project,
                        description: json.description,
                        createdTime: json.createdTime
                    };
                }
            };
        })
    );
</script>

<Main>
    <div class="mx-auto max-w-paragraph-lg">
        {#if $query.isPending}
            Loading...
        {:else if $query.data}
            <h1 class="text-h1">
                {$query.data.name}
            </h1>
            <p class="c-label">
                {page.params.identifier} · created <RelativeTime time={$query.data.createdTime} />
            </p>
            {#if $query.data.description != null}
                <p class="mt-8">
                    {$query.data.description ?? 'Description not available.'}
                </p>
            {/if}
        {/if}

        <div class="flex flex-wrap *:basis-48 gap-4 mt-8">
            <IssueCard projectId={data.project.id} />
            <MemberCard projectId={data.project.id} />
            <TeamCard projectId={data.project.id} />
        </div>

        <IssueList projectId={data.project.id} />
    </div>
</Main>
