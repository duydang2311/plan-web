import { prefetchQuery } from '~/lib/utils/query';
import type { PageLoad } from './$types';
import { InvitationListQuery, MemberListQuery } from './utils';

export const load: PageLoad = async ({ parent, url, data }) => {
    const { queryClient, project } = await parent();

    switch (data.view) {
        case 'pending':
            prefetchQuery(queryClient)(
                InvitationListQuery.key({
                    params: InvitationListQuery.params({
                        projectId: project.id,
                        url
                    })
                }),
                () => data.memberInvitationList
            );
            break;
        default:
            prefetchQuery(queryClient)(
                MemberListQuery.key({
                    params: MemberListQuery.params({
                        projectId: project.id,
                        url
                    })
                }),
                () => data.memberList
            );
            break;
    }

    return data;
};
