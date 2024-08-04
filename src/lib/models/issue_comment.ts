import type { Issue } from './issue';
import type { User } from './user';

export interface IssueComment {
    createdTime: string;
    updatedTime: string;
    id: string;
    authorId: string;
    author?: User;
    issue?: Issue;
    content: string;
}
