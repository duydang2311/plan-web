import type { Issue } from '~/lib/models/issue';
import type { Milestone } from '~/lib/models/milestone';
import type { Project } from '~/lib/models/project';

export type LocalSearchIssue = Pick<Issue, 'id' | 'orderNumber' | 'title'> & {
    project: Pick<Project, 'identifier'>;
};

export type LocalMilestone = Pick<
    Milestone,
    'id' | 'title' | 'emoji' | 'color' | 'endTime' | 'endTimeZone'
>;
