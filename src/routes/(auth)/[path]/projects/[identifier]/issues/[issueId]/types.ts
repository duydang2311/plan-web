import type { Issue } from '~/lib/models/issue';
import type { Project } from '~/lib/models/project';

export type LocalSearchIssue = Pick<Issue, 'id' | 'orderNumber' | 'title'> & {
    project: Pick<Project, 'identifier'>;
};
