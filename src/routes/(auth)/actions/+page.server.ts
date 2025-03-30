import { Effect } from 'effect';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse } from '~/lib/utils/kit';
import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';
import type { Actions } from './$types';

export const actions: Actions = {
    accept_friend_request: ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateAcceptFriendRequest(decodeAcceptFriendRequest(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).post('user-friend-requests/accept', {
                    body: {
                        senderId: validation.data.senderId,
                        receiverId: validation.data.receiverId
                    }
                })
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    },
    decline_friend_request: ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            yield* ActionResponse.UnknownError();
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateDeclineFriendRequest(decodeDeclineFriendRequest(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).delete(
                    `user-friend-requests/${validation.data.senderId}/${validation.data.receiverId}`
                )
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    },
    add_friend: ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateAddFriend(decodeAddFriend(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).post('user-friend-requests', {
                    body: {
                        senderId: validation.data.senderId,
                        receiverId: validation.data.receiverId
                    }
                })
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    },
    create_chat: async ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateCreateChat(decodeCreateChat(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).post('chats', {
                    body: {
                        memberIds: validation.data.memberIds
                    }
                })
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    }
};

const validateAcceptFriendRequest = validator(
    Type.Object({
        senderId: Type.String(),
        receiverId: Type.String()
    }),
    { stripLeadingSlash: true }
);

const decodeAcceptFriendRequest = (formData: FormData) => {
    return {
        senderId: formData.get('senderId'),
        receiverId: formData.get('receiverId')
    };
};

const validateDeclineFriendRequest = validateAcceptFriendRequest;
const decodeDeclineFriendRequest = decodeAcceptFriendRequest;

const validateAddFriend = validateAcceptFriendRequest;
const decodeAddFriend = decodeAcceptFriendRequest;

const decodeCreateChat = (formData: FormData) => {
    return {
        memberIds: formData.getAll('memberIds[]')
    };
};

const validateCreateChat = validator(
    Type.Object({
        memberIds: Type.Array(Type.String())
    }),
    { stripLeadingSlash: true }
);
