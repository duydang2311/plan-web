<script lang="ts">
    import { DateTime } from 'luxon';
    import { getStatusColor } from '~/lib/features/status/utils';
    import type { Status } from '~/lib/models/status';
    import { formatDateTimeUi } from '~/lib/utils/time';

    const {
        workspacePath,
        projectIdentifier,
        issueOrderNumber,
        issueTitle,
        oldStatus,
        newStatus,
        createdTime
    }: {
        workspacePath: string;
        projectIdentifier: string;
        issueOrderNumber: number;
        issueTitle: string;
        oldStatus?: Pick<Status, 'value' | 'color' | 'category'>;
        newStatus?: Pick<Status, 'value' | 'color' | 'category'>;
        createdTime: string;
    } = $props();
</script>

<a
    href="/{workspacePath}/projects/{projectIdentifier}/issues/{issueOrderNumber}"
    class="bg-base-1 dark:bg-base-3 hover:bg-base-hover text-base-fg-2 block gap-2 rounded-md px-4 py-2 transition"
>
    <p class="text-pretty">
        Task <strong>{issueTitle}</strong> has been updated from
        <span style={oldStatus ? `color: ${getStatusColor(oldStatus)}` : undefined}>
            <strong>{oldStatus?.value ?? 'No status'}</strong>
        </span>
        to
        <span style={newStatus ? `color: ${getStatusColor(newStatus)}` : undefined}>
            <strong>{newStatus?.value ?? 'No status'}</strong>
        </span>.
    </p>
    <p
        class="c-text-secondary"
        title={DateTime.fromISO(createdTime).toLocaleString(DateTime.DATETIME_MED)}
    >
        {formatDateTimeUi(createdTime)}
    </p>
</a>
