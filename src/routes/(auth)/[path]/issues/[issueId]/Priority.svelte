<script lang="ts">
    import { Button, Icon } from '~/lib/components';
    import { IssuePriorities, type IssuePriority } from '~/lib/models/issue';

    interface Props {
        priority: IssuePriority;
    }

    const { priority }: Props = $props();

    function getPriorityLabel(priority: IssuePriority) {
        switch (priority) {
            case IssuePriorities.none:
                return 'No priority';
            case IssuePriorities.low:
                return 'Low';
            case IssuePriorities.medium:
                return 'Medium';
            case IssuePriorities.high:
                return 'High';
            case IssuePriorities.urgent:
                return 'Urgent';
        }
    }

    function getPriorityIcon(priority: IssuePriority) {
        switch (priority) {
            case IssuePriorities.none:
                return 'priority-none';
            case IssuePriorities.low:
                return 'priority-low';
            case IssuePriorities.medium:
                return 'priority-medium';
            case IssuePriorities.high:
                return 'priority-high';
            case IssuePriorities.urgent:
                return 'priority-urgent';
        }
    }
</script>

<Button type="button" variant="base" class="flex gap-4 items-center">
    <Icon name={getPriorityIcon(priority)} />
    <span>
        {getPriorityLabel(priority)}
    </span>
</Button>
