<script lang="ts">
    import { Row } from '~/lib/components';
    import type { TeamMember } from '~/lib/models/team';
    import MemberRole from './MemberRole.svelte';

    interface Props {
        data: TeamMember;
    }

    const { data }: Props = $props();
</script>

<Row>
    <td>
        {data.member.email}
    </td>
    <td>
        <MemberRole {data} />
    </td>
</Row>
