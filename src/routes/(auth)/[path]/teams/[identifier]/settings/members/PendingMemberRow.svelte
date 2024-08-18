<script lang="ts">
    import { Row } from '~/lib/components';
    import Badge from '~/lib/components/Badge.svelte';
    import type { TeamInvitation } from '~/lib/models/team';

    interface Props {
        data: TeamInvitation;
    }

    const { data }: Props = $props();
</script>

<Row>
    <td>
        {data.member.email}
    </td>
    <td>
        <Badge variant="info" size="sm">Invitation pending</Badge>
    </td>
</Row>
