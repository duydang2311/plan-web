import type { Milestone, MilestoneStatus } from '~/lib/models/milestone';

export type LocalMilestone = Pick<
    Milestone,
    'id' | 'createdTime' | 'endTime' | 'title' | 'emoji' | 'color' | 'previewDescription'
> & {
    status?: Pick<MilestoneStatus, 'value' | 'icon' | 'color'>;
};
