import { Editor } from '@tiptap/core';
import { Effect, pipe, Stream } from 'effect';
import { Realtime } from '~/lib/services/realtime.client';
import { extend, validator } from '~/lib/utils/validation';

export const newCommentsStream = (issueId: string) =>
    Stream.unwrap(
        Effect.gen(function* () {
            const realtime = yield* Realtime;
            const subscription = yield* realtime.subscribe(`issues.${issueId}.comments.created`);
            yield* Effect.addFinalizer(() => {
                console.log('finalizer');
                return Effect.sync(subscription.unsubscribe);
            });
            return pipe(
                Stream.fromAsyncIterable(subscription, (e) => e),
                Stream.map((a) => a.json() as { issueCommentId: string })
            );
        })
    );

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
