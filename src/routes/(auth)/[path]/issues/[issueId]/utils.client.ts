import { Editor } from '@tiptap/core';
import { extend, validator } from '~/lib/utils/validation';
import { tryPromise } from '~/lib/utils/neverthrow';
import type { PaginatedList } from '~/lib/models/paginatedList';
import type { IssueComment } from '~/lib/models/issue_comment';

const validateEditor = validator<{ editor: Editor }>((input, { error }) => {
    if (typeof input !== 'object' || !input) {
        return error('root', 'object');
    }
    if (!('editor' in input) || !(input.editor instanceof Editor)) {
        return error('editor', 'Editor');
    }
});

export const clientValidate = extend<{ editor: Editor }, { editor: Editor; issueId: string }>(
    validateEditor,
    (input, { error }) => {
        if (typeof input !== 'object' || !input) {
            return error('root', 'object');
        }
        if (!('issueId' in input) || typeof input.issueId !== 'string') {
            return error('issueId', 'string');
        }

        const i = input as unknown as { editor: Editor };
        if (i.editor.isEmpty) {
            return error('content', 'string');
        }
    }
);

export function fetchCommentList({
    issueId,
    offset,
    size,
    signal
}: {
    issueId: string;
    offset: number;
    size: number;
    signal: AbortSignal;
}) {
    return tryPromise(
        fetch(
            `/api/issues/${issueId}/comments?offset=${offset}&size=${size}&select=CreatedTime,UpdatedTime,Id,Content,AuthorId`,
            { signal, method: 'get' }
        )
    )
        .map((a) => a.json<PaginatedList<IssueComment>>())
        .map((a) =>
            a.items.length === 0
                ? null
                : {
                      ...a,
                      nextOffset: offset + a.items.length
                  }
        );
}
