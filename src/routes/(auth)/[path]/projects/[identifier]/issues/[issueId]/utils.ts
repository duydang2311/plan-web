import { createQuery } from '@tanstack/svelte-query';
import { toStore } from 'svelte/store';
import { useRuntime } from '~/lib/contexts/runtime.client';
import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';
import type { LocalIssue } from './+page.server';

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

export const createFetchIssueQuery = () => {
    return {
        select: 'CreatedTime,UpdatedTime,Id,AuthorId,Title,Description,OrderNumber,Priority,StartTime,EndTime,TimelineZone,Author.Email,Author.Profile.Name,Author.Profile.DisplayName,Author.Profile.Image,Status.Id,Status.Value,Status.Icon,Milestone.Id,Milestone.Title,Milestone.Emoji,Milestone.Color,Milestone.EndTime,Milestone.EndTimeZone'
    };
};

export const createIssueQuery = (depsFn: () => { issueId: string }) => {
    const { api } = useRuntime();
    return createQuery(
        toStore(() => {
            const { issueId } = depsFn();
            return {
                queryKey: ['issues', { issueId }],
                queryFn: async () => {
                    const response = await api.get(`issues/${issueId}`, {
                        query: createFetchIssueQuery()
                    });
                    return await response.json<LocalIssue>();
                }
            };
        })
    );
};

export const createIssueAuditListQuery = ({
    issueId,
    offset,
    size
}: {
    issueId: string;
    offset: number;
    size: number;
}) => {
    return {
        issueId,
        select: 'Id,CreatedTime,Action,Data,User.Id,User.Email,User.Profile.Name,User.Profile.DisplayName,User.Profile.Image',
        offset,
        size
    };
};
