import type { Issue } from './issue';

export interface IssueComment {
	createdTime: string;
	updatedTime: string;
	id: string;
	issue?: Issue;
	content: string;
}
