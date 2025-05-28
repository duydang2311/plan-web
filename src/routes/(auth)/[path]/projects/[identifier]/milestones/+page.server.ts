import { pipe } from '@baetheus/fun/fn';
import type { PaginatedList } from '~/lib/models/paginatedList';
import { LoadAttempt } from '~/lib/utils/kit';
import { maybeStream } from '~/lib/utils/promise';
import type { PageServerLoad } from './$types';
import type { LocalMilestone } from './utils';

export const load: PageServerLoad = async ({ parent, url, locals, isDataRequest }) => {
    const data = await parent();
    const order = url.searchParams.get('order') || '-Id';
    const getMilestones = await pipe(
        (async () => {
            const getAttempt = await LoadAttempt.HTTP(() =>
                locals.api.get('milestones', {
                    query: {
                        projectId: data.project.id,
                        select: 'Id,CreatedTime,EndTime,Title,Emoji,Color,PreviewDescription,Status.Value,Status.Icon,Status.Color',
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
