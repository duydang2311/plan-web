import type { Issue } from './issue';

export type ChecklistItem = {
    createdTime: string;
    id: string;
    parentIssueId: string;
    parentIssue: Issue;
} & (
    | {
          kind: ChecklistItemKind.Todo;
          content: string;
          completed: boolean;
          subIssueId?: never;
          subIssue?: never;
      }
    | {
          kind: ChecklistItemKind.SubIssue;
          content?: never;
          completed?: never;
          subIssueId: string;
          subIssue: Issue;
      }
);

export enum ChecklistItemKind {
    Todo = 1,
    SubIssue = 2
}
