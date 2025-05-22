import { pipe } from 'effect';
import { errorCodes } from '~/lib/models/errors';
import type { UserPreset, UserProfile, UserSocialLink } from '~/lib/models/user';
import { ActionAttempt } from '~/lib/utils/kit';
import { maybeStream } from '~/lib/utils/promise';
import { attempt } from '~/lib/utils/try';
import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';
import type { Actions, PageServerLoad } from './$types';
import { decodeAddSocialLink, validateAddSocialLink } from './utils';

export type LocalUser = UserPreset['id'] &
    UserPreset['email'] &
    UserPreset['profile'] & {
        profile?: Pick<UserProfile, 'bio'> & {
            socialLinks: (OneOf<{ optimisticId: string }, Pick<UserSocialLink, 'id'>> &
                Pick<UserSocialLink, 'url'>)[];
        };
    };

export const load: PageServerLoad = async ({ locals, isDataRequest, params }) => {
    const tryGet = await pipe(
        (async () => {
            const getAttempt = await attempt.promise(() =>
                locals.api.get(`users/profile-name/${params.username}`, {
                    query: {
                        select: 'Id,Email,Profile.Name,Profile.DisplayName,Profile.Image,Profile.Bio,Profile.SocialLinks'
                    }
                })
            )(errorCodes.fromFetch);
            if (getAttempt.failed) {
                return getAttempt;
            }

            const jsonAttempt = await attempt.promise(() => getAttempt.data.json<LocalUser>())(
                errorCodes.fromJson
            );

            return jsonAttempt;
        })(),
        (a) => maybeStream(a)(isDataRequest)
    );

    return {
        getUser: tryGet()
    };
};

export const actions: Actions = {
    update_bio: async ({ request, locals }) => {
        const formDataAttempt = await ActionAttempt.FormData(() => request.formData());
        if (formDataAttempt.failed) {
            return ActionAttempt.Failure(formDataAttempt);
        }

        const validateAttempt = ActionAttempt.Validate(() =>
            validateUpdateBio(decodeUpdateBio(formDataAttempt.data))
        );
        if (validateAttempt.failed) {
            return ActionAttempt.Failure(validateAttempt);
        }

        const patchAttempt = await ActionAttempt.HTTP(() =>
            locals.api.patch(`user-profiles/${validateAttempt.data.userId}`, {
                body: { patch: { bio: validateAttempt.data.bio } }
            })
        );
        if (patchAttempt.failed) {
            return ActionAttempt.Failure(patchAttempt);
        }
    },
    create_social_link: async ({ request, locals }) => {
        const formDataAttempt = await ActionAttempt.FormData(() => request.formData());
        if (formDataAttempt.failed) {
            return ActionAttempt.Failure(formDataAttempt);
        }

        const validateAttempt = ActionAttempt.Validate(() =>
            validateAddSocialLink(decodeAddSocialLink(formDataAttempt.data))
        );
        if (validateAttempt.failed) {
            return ActionAttempt.Failure(validateAttempt);
        }

        const postAttempt = await ActionAttempt.HTTP(() =>
            locals.api.post('user-social-links', {
                body: {
                    userId: validateAttempt.data.userId,
                    url: validateAttempt.data.url
                }
            })
        );
        if (postAttempt.failed) {
            return ActionAttempt.Failure(postAttempt);
        }

        const jsonAttempt = await ActionAttempt.JSON(() =>
            postAttempt.data.json<Pick<UserSocialLink, 'id'>>()
        );
        if (jsonAttempt.failed) {
            return ActionAttempt.Failure(jsonAttempt);
        }
        return jsonAttempt.data;
    },
    delete_social_link: async ({ request, locals }) => {
        const formDataAttempt = await ActionAttempt.FormData(() => request.formData());
        if (formDataAttempt.failed) {
            return ActionAttempt.Failure(formDataAttempt);
        }

        const validateAttempt = ActionAttempt.Validate(() =>
            validateDeleteSocialLink(decodeDeleteSocialLink(formDataAttempt.data))
        );
        if (validateAttempt.failed) {
            return ActionAttempt.Failure(validateAttempt);
        }

        const deleteAttempt = await ActionAttempt.HTTP(() =>
            locals.api.delete(`user-social-links/${validateAttempt.data.id}`)
        );
        if (deleteAttempt.failed) {
            return ActionAttempt.Failure(deleteAttempt);
        }
    },
    update_display_name: async ({ request, locals }) => {
        const formDataAttempt = await ActionAttempt.FormData(() => request.formData());
        if (formDataAttempt.failed) {
            return ActionAttempt.Failure(formDataAttempt);
        }

        const validateAttempt = ActionAttempt.Validate(() =>
            validateDisplayName(decodeDisplayName(formDataAttempt.data))
        );
        if (validateAttempt.failed) {
            return ActionAttempt.Failure(validateAttempt);
        }

        const patchAttempt = await ActionAttempt.HTTP(() =>
            locals.api.patch(`user-profiles/${validateAttempt.data.userId}`, {
                body: { patch: { displayName: validateAttempt.data.displayName } }
            })
        );
        if (patchAttempt.failed) {
            return ActionAttempt.Failure(patchAttempt);
        }
    }
};

const decodeUpdateBio = (formData: FormData) => {
    return {
        userId: formData.get('userId'),
        bio: formData.get('bio')?.toString().trim()
    };
};

const validateUpdateBio = validator(
    Type.Object({
        userId: Type.String(),
        bio: Type.String()
    }),
    { stripLeadingSlash: true }
);

const decodeDeleteSocialLink = (formData: FormData) => {
    return {
        id: formData.get('id')
    };
};

const validateDeleteSocialLink = validator(
    Type.Object({
        id: Type.Number()
    }),
    { stripLeadingSlash: true, convert: true }
);

const decodeDisplayName = (formData: FormData) => {
    return {
        userId: formData.get('userId'),
        displayName: formData.get('displayName')?.toString().trim()
    };
};

const validateDisplayName = validator(
    Type.Object({
        userId: Type.String(),
        displayName: Type.String({ minLength: 1 })
    }),
    { stripLeadingSlash: true }
);
