import type { Milestone, MilestoneStatus } from '~/lib/models/milestone';
import type { SubmitFunction } from './$types';

export type LocalMilestoneStatus = Pick<
    MilestoneStatus,
    'id' | 'value' | 'icon' | 'color' | 'category'
>;
export type LocalMilestone = Pick<
    Milestone,
    'id' | 'createdTime' | 'endTime' | 'endTimeZone' | 'title' | 'emoji' | 'color' | 'description'
> & {
    status?: LocalMilestoneStatus;
};
export type OnTitleSubmit = (
    id: string,
    ...args: Parameters<SubmitFunction>
) => ReturnType<SubmitFunction>;

export type OnDescriptionSubmit = (
    id: string,
    ...args: Parameters<SubmitFunction>
) => ReturnType<SubmitFunction>;

export type OnDeleteSubmit = (
    id: string,
    ...args: Parameters<SubmitFunction>
) => ReturnType<SubmitFunction>;
