<script lang="ts">
    import { Main } from '~/lib/components';
    import ProjectMemberList from './ProjectMemberList.svelte';
    import type { PageData } from './$types';

    const { data }: { data: PageData } = $props();
</script>

<Main class="p-0">
    <ProjectMemberList projectId={data.project.id} />
</Main>
