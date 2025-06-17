<script lang="ts">
    import { DateTime } from 'luxon';
    import { formatDateTimeUi } from '~/lib/utils/time';

    const {
        workspacePath,
        projectIdentifier,
        projectName,
        createdTime
    }: {
        workspacePath: string;
        projectIdentifier: string;
        projectName: string;
        createdTime: string;
    } = $props();
</script>

<a
    href="/{workspacePath}/projects/{projectIdentifier}"
    class="bg-base-1 dark:bg-base-3 hover:bg-base-hover text-base-fg-2 block gap-2 rounded-md px-4 py-2 transition"
>
    <p class="text-pretty">
        New project created —
        <strong class="text-base-fg-1">
            {projectName}
        </strong>.
    </p>
    <p
        class="c-text-secondary"
        title={DateTime.fromISO(createdTime).toLocaleString(DateTime.DATETIME_MED)}
    >
        {formatDateTimeUi(createdTime)}
    </p>
</a>
