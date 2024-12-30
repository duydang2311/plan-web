import { Type } from '~/lib/utils/typebox';
import { paginatedQuery, queryParams } from '~/lib/utils/url';
import { validator } from '~/lib/utils/validation';

export const decodeInviteMember = (formData: FormData) => ({
    workspaceId: formData.get('workspaceId'),
    userId: formData.get('userId')
});

export const validateInviteMember = validator(
    Type.Object({
        workspaceId: Type.String(),
        userId: Type.String()
    })
);

export const workspaceMembersParams = ({ url, order }: { url: URL; order?: string | null }) =>
    ({
        ...paginatedQuery(
            queryParams(url, {
                page: 1,
                size: 20
            })
        ),
        order: order === undefined ? url.searchParams.get('order') : order,
        select: 'CreatedTime,UpdatedTime,Id,UserId,User.Email,Role.Name'
    }) as const;

export const pendingMembersParams = ({
    url,
    workspaceId,
    order
}: {
    url: URL;
    workspaceId: string;
    order?: string | null;
}) =>
    ({
        ...paginatedQuery(
            queryParams(url, {
                page: 1,
                size: 20
            })
        ),
        workspaceId,
        order: order === undefined ? url.searchParams.get('order') : order,
        select: 'CreatedTime,Id,User.Id,User.Email,User.Profile.DisplayName,User.Profile.Image'
    }) as const;

export const validateDeleteMemberActionFailure = validator(
    Type.Object({
        errors: Type.Object({
            root: Type.Array(Type.String())
        })
    })
);
