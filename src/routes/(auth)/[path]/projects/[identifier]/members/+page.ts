import type { PageLoad } from './$types';
import { InvitationListQuery, MemberListQuery } from './utils';

export const load: PageLoad = async ({ parent, url, data }) => {
    const { queryClient, project } = await parent();

    switch (data.view) {
        case 'pending':
            await queryClient.prefetchQuery({
                queryKey: InvitationListQuery.key({
                    params: InvitationListQuery.params({
                        projectId: project.id,
                        url
                    })
                }),
                queryFn: () => data.memberInvitationList
            });
            break;
        default:
            await queryClient.prefetchQuery({
                queryKey: MemberListQuery.key({
                    params: MemberListQuery.params({
                        projectId: project.id,
                        url
                    })
                }),
                queryFn: () => data.memberList
            });
            break;
    }

    return data;
};
