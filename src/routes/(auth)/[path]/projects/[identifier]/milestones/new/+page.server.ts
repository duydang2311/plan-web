import { redirect } from '@sveltejs/kit';
import { ActionAttempt } from '~/lib/utils/kit';
import type { Actions } from './$types';
import { decodeCreateMilestone, validateCreateMilestone } from './utils';

export const actions: Actions = {
    default: async ({ request, locals, params }) => {
        const formDataAttempt = await ActionAttempt.FormData(() => request.formData());
        if (formDataAttempt.failed) {
            return ActionAttempt.Failure(formDataAttempt);
        }

        const validation = ActionAttempt.Validate(() =>
            validateCreateMilestone(decodeCreateMilestone(formDataAttempt.data))
        );
        if (validation.failed) {
            return ActionAttempt.Failure(validation);
        }

        const postAttempt = await ActionAttempt.HTTP(() =>
            locals.api.post('milestones', {
                body: {
                    projectId: validation.data.projectId,
                    title: validation.data.title,
                    description: validation.data.description,
                    emoji: validation.data.emoji,
                    color: validation.data.color,
                    statusId: validation.data.statusId
                }
            })
        );
        if (postAttempt.failed) {
            return ActionAttempt.Failure(postAttempt);
        }

        return redirect(303, `/${params.path}/projects/${params.identifier}/milestones`);
    }
};
