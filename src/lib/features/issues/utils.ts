import {
    IconPriorityHigh,
    IconPriorityLow,
    IconPriorityMedium,
    IconPriorityNone,
    IconPriorityUrgent
} from '~/lib/components/icons';
import { IssuePriorities, type IssuePriority } from '~/lib/models/issue';

const priorityIcons = {
    [IssuePriorities.none]: IconPriorityNone,
    [IssuePriorities.low]: IconPriorityLow,
    [IssuePriorities.medium]: IconPriorityMedium,
    [IssuePriorities.high]: IconPriorityHigh,
    [IssuePriorities.urgent]: IconPriorityUrgent
};

export const getIssuePriorityLabel = (priority: IssuePriority) => {
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
};

export const getIssuePriorityIcon = (priority: IssuePriority) => {
    return priorityIcons[priority];
};

export const getIssuePriorityColor = (priority: IssuePriority) => {
    switch (priority) {
        case IssuePriorities.none:
            return 'var(--color-priority-none)';
        case IssuePriorities.low:
            return 'var(--color-priority-low)';
        case IssuePriorities.medium:
            return 'var(--color-priority-medium)';
        case IssuePriorities.high:
            return 'var(--color-priority-high)';
        case IssuePriorities.urgent:
            return 'var(--color-priority-urgent)';
    }
};
