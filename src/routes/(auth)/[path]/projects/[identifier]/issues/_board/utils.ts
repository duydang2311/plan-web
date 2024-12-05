import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';
import type { LocalBoardIssue } from '../+page.server';

export function toDraggableIssueData(issue: LocalBoardIssue) {
    return {
        type: 'issue',
        id: issue.id,
        statusId: issue.statusId ?? -1,
        statusRank: issue.statusRank
    };
}

export const validateDraggableIssueData = validator(
    Type.Object({
        type: Type.Literal('issue'),
        id: Type.String(),
        statusId: Type.Optional(Type.Union([Type.Null(), Type.Number()])),
        statusRank: Type.String()
    })
);
