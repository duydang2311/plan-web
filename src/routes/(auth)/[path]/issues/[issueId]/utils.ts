import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';

export const validate = validator<{ issueId: string; content: string }>((input, { error }) => {
    if (typeof input !== 'object' || !input) {
        return error('root', 'object');
    }
    if (!('issueId' in input) || typeof input.issueId !== 'string') {
        return error('issueId', 'string');
    }

    if (!('content' in input) || typeof input.content !== 'string') {
        return error('content', 'string');
    }
    const content = input.content.trim();
    if (content.length === 0) {
        return error('content', 'string');
    }

    input.content = content;
});

export const validateEditDescription = validator<{ issueId: string; description: string }>(
    (input, { error }) => {
        if (typeof input !== 'object' || !input) {
            return error('root', 'object');
        }
        if (!('issueId' in input) || typeof input.issueId !== 'string') {
            return error('issueId', 'string');
        }

        if (!('description' in input) || typeof input.description !== 'string') {
            return error('description', 'string');
        }
        const description = input.description.trim();
        if (description.length === 0) {
            return error('description', 'string');
        }

        input.description = description;
    }
);

export const validateEditComment = validator(
    Type.Object({
        id: Type.Number(),
        content: Type.String()
    }),
    { convert: true, stripLeadingSlash: true }
);

export const validateDeleteIssue = validator<{ issueId: string }>((input, { error }) => {
    if (typeof input !== 'object' || !input) {
        return error('root', 'object');
    }
    if (!('issueId' in input) || typeof input.issueId !== 'string') {
        return error('issueId', 'string');
    }
});

export const validateDeleteComment = validator(
    Type.Object({
        id: Type.Number()
    }),
    { convert: true, stripLeadingSlash: true }
);

export function decode(formData: FormData) {
    return {
        issueId: formData.get('issueId'),
        content: formData.get('content')
    };
}

export function decodeEditDescription(formData: FormData) {
    return {
        issueId: formData.get('issueId'),
        description: formData.get('description')
    };
}

export function decodeEditComment(formData: FormData) {
    return {
        id: formData.get('id'),
        content: formData.get('content')
    };
}

export function decodeDeleteIssue(formData: FormData) {
    return {
        issueId: formData.get('issueId')
    };
}

export function decodeDeleteComment(formData: FormData) {
    return {
        id: formData.get('id')
    };
}
