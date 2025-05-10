import { StatusCategory } from '~/lib/models/status';
import { validator } from '~/lib/utils/validation';

const invalidStatusValueRegExp = /[^a-zA-Z0-9\s]/;

export const validateAddStatus = validator<{
    workspaceId: string;
    value: string;
    category: number;
    description?: string;
}>((input, { error }) => {
    if (!input || typeof input !== 'object') {
        return error('$', 'object');
    }

    if (!('workspaceId' in input) || !input.workspaceId || typeof input.workspaceId !== 'string') {
        return error('workspaceId', 'string');
    }

    if (
        !('value' in input) ||
        !input.value ||
        typeof input.value !== 'string' ||
        input.value.length === 0
    ) {
        return error('value', 'string');
    }

    if (!('category' in input) || !input.category) {
        return error('category', 'required');
    }

    const categoryNumber = Number(input.category);
    if (isNaN(categoryNumber) || !StatusCategory[categoryNumber]) {
        return error('category', 'invalid');
    }
    input.category = categoryNumber;

    if (invalidStatusValueRegExp.test(input.value)) {
        return error('value', 'invalid');
    }

    if (
        'description' in input &&
        input.description != null &&
        typeof input.description !== 'string'
    ) {
        return error('description', 'string');
    }
});

export const decodeAddStatus = (formData: FormData) => ({
    workspaceId: formData.get('workspaceId'),
    value: formData.get('value'),
    category: formData.get('category'),
    description: formData.get('description')
});

export const validateDeleteStatus = validator<{
    statusId: number;
}>((input, { error }) => {
    if (!input || typeof input !== 'object') {
        return error('$', 'object');
    }

    if (!('statusId' in input) || !input.statusId) {
        return error('statusId', 'number');
    }

    if (
        (typeof input.statusId !== 'number' && typeof input.statusId !== 'string') ||
        isNaN(Number(input.statusId))
    ) {
        return error('statusId', 'number');
    }

    input.statusId = Number(input.statusId);
});

export const decodeDeleteStatus = (formData: FormData) => ({
    statusId: formData.get('statusId')
});

export const toDraggleStatusData = <T extends object>(status: T) => ({
    type: 'status' as const,
    ...status
});

export const validateDraggleStatusData = validator<{ type: 'status' }>((input, { error }) => {
    if (!input || typeof input !== 'object') {
        return error('$', 'object');
    }
    if (!('type' in input) || input.type !== 'status') {
        return error('type', 'invalid');
    }
});
