<script lang="ts">
    import { page } from '$app/state';
    import { Main, RelativeTime } from '~/lib/components';
    import type { PageData } from './$types';
    import IssueCard from './IssueCard.svelte';
    import IssueList from './IssueList.svelte';
    import MemberCard from './MemberCard.svelte';
    import TeamCard from './TeamCard.svelte';
    import Await from '~/lib/components/Await.svelte';

    const { data }: { data: PageData } = $props();
</script>

<Main>
    <div class="max-w-paragraph-lg mx-auto">
        <h1 class="text-h1 tracking-none">
            {data.project.name}
        </h1>
        <p class="c-label">
            {page.params.identifier} · created <RelativeTime time={data.project.createdTime} />
        </p>
        {#if data.project.description != null}
            <p class="c-label mt-2">
                {data.project.description ?? 'Description not available.'}
            </p>
        {/if}

        <div class="mt-8 flex flex-wrap gap-4 *:basis-48">
            <Await resolve={data.issueList}>
                {#snippet children({ value, loading })}
                    <IssueCard issueList={value} {loading} />
                {/snippet}
            </Await>
            <Await resolve={data.memberMetadata}>
                {#snippet children({ value, loading })}
                    <MemberCard metadata={value} {loading} />
                {/snippet}
            </Await>
            <Await resolve={data.teamMetadata}>
                {#snippet children({ value, loading })}
                    <TeamCard metadata={value} {loading} />
                {/snippet}
            </Await>
        </div>

        <Await resolve={data.issueList}>
            {#snippet children({ value, loading })}
                <IssueList issueList={value} {loading} />
            {/snippet}
        </Await>
    </div>
</Main>
