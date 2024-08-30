import type { Issue } from '~/lib/models/issue';
import { validator } from '~/lib/utils/validation';

export function toDraggableIssueData(issue: Issue) {
    return {
        type: 'issue',
        id: issue.id,
        statusId: issue.statusId ?? -1,
        orderByStatus: issue.orderByStatus
    };
}

export const validateDraggableIssueData = validator<ReturnType<typeof toDraggableIssueData>>(
    (input, { error }) => {
        if (!input || typeof input !== 'object') {
            return error('root', 'object');
        }

        if (!('type' in input) || !input.type || typeof input.type !== 'string') {
            return error('type', 'string');
        }

        if (input.type !== 'issue') {
            return error('type', 'invalid');
        }

        if (!('id' in input) || !input.id || typeof input.id !== 'string') {
            return error('id', 'string');
        }

        if (
            !('statusId' in input) ||
            (input.statusId != null && typeof input.statusId !== 'number')
        ) {
            return error('statusId', 'number');
        }

        if (
            !('orderByStatus' in input) ||
            input.orderByStatus == null ||
            typeof input.orderByStatus !== 'number'
        ) {
            return error('orderByStatus', 'number');
        }
    }
);
