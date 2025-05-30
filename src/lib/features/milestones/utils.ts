import { MilestoneStatusCategory, type MilestoneStatus } from '~/lib/models/milestone';

export const getMilestoneStatusCategoryColor = (category: MilestoneStatusCategory) => {
    switch (category) {
        case MilestoneStatusCategory.Pending:
            return 'var(--color-status-pending)';
        case MilestoneStatusCategory.Ongoing:
            return 'var(--color-status-ongoing)';
        case MilestoneStatusCategory.Completed:
            return 'var(--color-status-completed)';
        case MilestoneStatusCategory.Canceled:
            return 'var(--color-status-canceled)';
        case MilestoneStatusCategory.Paused:
            return 'var(--color-status-paused)';
        default:
            return 'var(--color-status-pending)';
    }
};

export const getMilestoneStatusColor = (status: Pick<MilestoneStatus, 'category' | 'color'>) => {
    return status.color || getMilestoneStatusCategoryColor(status.category);
};

export const milestoneColors = Object.freeze([
    'oklch(0.72 0.18 10)',
    'oklch(0.73 0.18 30)',
    'oklch(0.75 0.17 50)',
    'oklch(0.76 0.18 70)',
    'oklch(0.75 0.20 95)',
    'oklch(0.74 0.20 120)',
    'oklch(0.73 0.20 145)',
    'oklch(0.72 0.21 170)',
    'oklch(0.71 0.20 195)',
    'oklch(0.70 0.19 220)',
    'oklch(0.68 0.18 245)',
    'oklch(0.67 0.18 270)',
    'oklch(0.68 0.19 290)',
    'oklch(0.70 0.18 310)',
    'oklch(0.72 0.17 330)',
    'oklch(0.73 0.17 350)',
    'oklch(0.66 0.09 250)',
    'oklch(0.70 0.08 110)',
    'oklch(0.72 0.10 40)',
    'oklch(0.68 0.07 20)'
]);
