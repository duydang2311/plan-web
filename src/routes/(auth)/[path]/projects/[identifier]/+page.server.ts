import { error } from '@sveltejs/kit';
import { Effect, Exit } from 'effect';
import type { Issue } from '~/lib/models/issue';
import type { Metadata } from '~/lib/models/metadata';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import type { Project } from '~/lib/models/project';
import { ApiClient } from '~/lib/services/api_client.server';
import { LoadResponse } from '~/lib/utils/kit';
import type { PageServerLoad } from './$types';
import type { WorkspaceStatus } from '~/lib/models/status';
import { maybeStream } from '~/lib/utils/promise';

export type LocalProject = Pick<Project, 'createdTime' | 'id' | 'name' | 'description'>;
export type LocalIssue = Pick<
    Issue,
    'id' | 'createdTime' | 'title' | 'description' | 'orderNumber'
> & { status?: Pick<WorkspaceStatus, 'id' | 'value' | 'icon' | 'color'> };

export const load: PageServerLoad = async ({ parent, locals: { runtime }, isDataRequest }) => {
    const data = await parent();
    const exit = await Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(`projects/${data.project.id}`, {
                query: { select: 'CreatedTime,Description' }
            })
        );

        return yield* LoadResponse.JSON(() => response.json<LocalProject>());
    }).pipe(runtime.runPromiseExit);

    if (Exit.isFailure(exit)) {
        const { status, ...body } = LoadResponse.Failure(exit);
        return error(status, body);
    }

    const [getIssueList, getTeamMetadata, getMemberMetadata] = await Promise.all([
        fetchIssueList(data.project.id).pipe(
            Effect.orElseSucceed(() => paginatedList<LocalIssue>()),
            runtime.runPromise,
            (a) => maybeStream(a)(isDataRequest)
        ),
        fetchTeamMetadata(data.project.id).pipe(
            Effect.orElseSucceed(() => ({ count: 0, totalCount: 0 }) as Metadata),
            runtime.runPromise,
            (a) => maybeStream(a)(isDataRequest)
        ),
        fetchMemberMetadata(data.project.id).pipe(
            Effect.orElseSucceed(() => ({ count: 0, totalCount: 0 }) as Metadata),
            runtime.runPromise,
            (a) => maybeStream(a)(isDataRequest)
        )
    ]);

    return {
        project: {
            ...data.project,
            description: exit.value.description,
            createdTime: exit.value.createdTime
        },
        issueList: getIssueList(),
        teamMetadata: getTeamMetadata(),
        memberMetadata: getMemberMetadata()
    };
};

const fetchIssueList = (projectId: string) => {
    return Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(`issues`, {
                query: {
                    projectId,
                    select: 'CreatedTime,UpdatedTime,Id,Title,Description,OrderNumber',
                    size: 5
                }
            })
        );
        return yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalIssue>>());
    });
};

const fetchTeamMetadata = (projectId: string) => {
    return Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(`projects/${projectId}/teams/metadata`)
        );
        return yield* LoadResponse.JSON(() => response.json<Metadata>());
    });
};

const fetchMemberMetadata = (projectId: string) => {
    return Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(`projects/${projectId}/members/metadata`)
        );
        return yield* LoadResponse.JSON(() => response.json<Metadata>());
    });
};
