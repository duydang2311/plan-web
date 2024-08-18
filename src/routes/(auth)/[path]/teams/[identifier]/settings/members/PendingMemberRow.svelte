<script lang="ts">
    import { Row } from '~/lib/components';
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
</Row>
