import { Editor } from '@tiptap/core';
import { extend, validator } from '~/lib/utils/validation';

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
