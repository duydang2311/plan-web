import { MilestoneStatusCategory } from '~/lib/models/milestone';
import { IconTodo, IconInProgress, IconDone, IconCanceled, IconPause } from '.';

const milestoneStatusIcons = Object.freeze({
    'not-started': IconTodo,
    'in-progress': IconInProgress,
    completed: IconDone,
    canceled: IconCanceled,
    paused: IconPause
});

const milestoneStatusIconByCategories = Object.freeze({
    [MilestoneStatusCategory.Pending]: IconTodo,
    [MilestoneStatusCategory.Ongoing]: IconInProgress,
    [MilestoneStatusCategory.Completed]: IconDone,
    [MilestoneStatusCategory.Canceled]: IconCanceled,
    [MilestoneStatusCategory.Paused]: IconPause
});

export const getMilestoneStatusIcon = (
    icon: string | undefined,
    category?: MilestoneStatusCategory
) => {
    if (icon && icon in milestoneStatusIcons) {
        return milestoneStatusIcons[icon as keyof typeof milestoneStatusIcons];
    }
    if (category != null && category in milestoneStatusIconByCategories) {
        return milestoneStatusIconByCategories[category];
    }
};
