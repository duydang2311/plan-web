import { IconTodo, IconInProgress, IconDone, IconCanceled, IconPause } from '.';

const milestoneStatusIcons = Object.freeze({
    'not-started': IconTodo,
    'in-progress': IconInProgress,
    completed: IconDone,
    canceled: IconCanceled,
    paused: IconPause
});

export const getMilestoneStatusIcon = (icon: string | undefined) => {
    if (icon && icon in milestoneStatusIcons) {
        return milestoneStatusIcons[icon as keyof typeof milestoneStatusIcons];
    }
};
