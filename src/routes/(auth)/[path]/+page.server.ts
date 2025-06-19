import type { Context } from 'effect';
import type { HttpClient } from '~/lib/services/http_client';
import { LoadAttempt } from '~/lib/utils/kit';
import { maybeStream } from '~/lib/utils/promise';
import type { PageServerLoad } from './$types';

interface LocalWorkspaceAnalytics {
    totalProjects: number;
    activeIssues: number;
    totalMembers: number;
    issuesDueThisWeek: number;
}

export const load: PageServerLoad = async ({ parent, locals, isDataRequest }) => {
    const data = await parent();
    const getAnalyticsAsStream = await maybeStream(getAnalytics(locals.api)(data.workspace.id))(
        isDataRequest
    );

    return {
        getAnalytics: getAnalyticsAsStream()
    };
};

const getAnalytics = (api: Context.Tag.Service<HttpClient>) => async (workspaceId: string) => {
    const getAttempt = await LoadAttempt.HTTP(() => api.get(`workspaces/${workspaceId}/analytics`));
    if (getAttempt.failed) {
        return getAttempt;
    }

    return await LoadAttempt.JSON(() => getAttempt.data.json<LocalWorkspaceAnalytics>());
};
