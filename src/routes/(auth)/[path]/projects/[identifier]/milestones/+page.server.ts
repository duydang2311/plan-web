import { pipe } from '@baetheus/fun/fn';
import type { PaginatedList } from '~/lib/models/paginatedList';
import { ActionAttempt, LoadAttempt } from '~/lib/utils/kit';
import { maybeStream } from '~/lib/utils/promise';
import type { Actions, PageServerLoad } from './$types';
import {
    decodeUpdateDescription,
    decodeUpdateTitle,
    validateUpdateDescription,
    validateUpdateTitle,
} from './utils';
import type { LocalMilestone } from './types';

export const load: PageServerLoad = async ({ parent, url, locals, isDataRequest }) => {
    const data = await parent();
    const order = url.searchParams.get('order') || 'EndTime,-Id';
    const getMilestones = await pipe(
        (async () => {
            const getAttempt = await LoadAttempt.HTTP(() =>
                locals.api.get('milestones', {
                    query: {
                        projectId: data.project.id,
                        select: 'Id,CreatedTime,EndTime,EndTimeZone,Title,Emoji,Color,Description,Status.Id,Status.Value,Status.Icon,Status.Color,Status.Category',
                        order
                    }
                })
            );
            if (getAttempt.failed) {
                return getAttempt;
            }

            return await LoadAttempt.JSON(() =>
                getAttempt.data.json<PaginatedList<LocalMilestone>>()
            );
        })(),
        (a) => maybeStream(a)(isDataRequest)
    );

    return {
        getMilestones: getMilestones()
    };
};

export const actions: Actions = {
    update_title: async ({ request, locals }) => {
        const formDataAttempt = await ActionAttempt.FormData(() => request.formData());
        if (formDataAttempt.failed) {
            return ActionAttempt.Failure(formDataAttempt);
        }

        const validateAttempt = ActionAttempt.Validate(() =>
            validateUpdateTitle(decodeUpdateTitle(formDataAttempt.data))
        );
        if (validateAttempt.failed) {
            return ActionAttempt.Failure(validateAttempt);
        }

        const patchAttempt = await ActionAttempt.HTTP(() =>
            locals.api.patch(`milestones/${validateAttempt.data.id}`, {
                body: {
                    patch: {
                        title: validateAttempt.data.title
                    }
                }
            })
        );
        if (patchAttempt.failed) {
            return ActionAttempt.Failure(patchAttempt);
        }
    },
    update_description: async ({ request, locals }) => {
        const formDataAttempt = await ActionAttempt.FormData(() => request.formData());
        if (formDataAttempt.failed) {
            return ActionAttempt.Failure(formDataAttempt);
        }

        const validateAttempt = ActionAttempt.Validate(() =>
            validateUpdateDescription(decodeUpdateDescription(formDataAttempt.data))
        );
        if (validateAttempt.failed) {
            return ActionAttempt.Failure(validateAttempt);
        }

        console.log('validateAttempt', validateAttempt.data);
        const patchAttempt = await ActionAttempt.HTTP(() =>
            locals.api.patch(`milestones/${validateAttempt.data.id}`, {
                body: {
                    patch: {
                        description: validateAttempt.data.description
                    }
                }
            })
        );
        if (patchAttempt.failed) {
            return ActionAttempt.Failure(patchAttempt);
        }
    }
};
