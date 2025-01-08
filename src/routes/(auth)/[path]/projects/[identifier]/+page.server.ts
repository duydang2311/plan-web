import { error } from '@sveltejs/kit';
import { Effect, Exit } from 'effect';
import type { Issue } from '~/lib/models/issue';
import type { Metadata } from '~/lib/models/metadata';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import type { Project } from '~/lib/models/project';
import { ApiClient } from '~/lib/services/api_client.server';
import { LoadResponse } from '~/lib/utils/kit';
import type { PageServerLoad } from './$types';
import { createIssueListQueryParams, createProjectQueryParams } from './utils';
import type { WorkspaceStatus } from '~/lib/models/status';

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
                query: createProjectQueryParams()
            })
        );

        return yield* LoadResponse.JSON(() => response.json<LocalProject>());
    }).pipe(runtime.runPromiseExit);

    if (Exit.isFailure(exit)) {
        const { status, ...body } = LoadResponse.Failure(exit);
        return error(status, body);
    }

    const issueListEffect = fetchIssueList(data.project.id).pipe(
        Effect.orElseSucceed(() => paginatedList<LocalIssue>())
    );

    const teamMedataEffect = fetchTeamMetadata(data.project.id).pipe(
        Effect.orElseSucceed(() => ({ count: 0, totalCount: 0 }) as Metadata)
    );

    const memberMedataEffect = fetchMemberMetadata(data.project.id).pipe(
        Effect.orElseSucceed(() => ({ count: 0, totalCount: 0 }) as Metadata)
    );

    if (isDataRequest) {
        return {
            project: {
                ...data.project,
                description: exit.value.description
            },
            issueList: issueListEffect.pipe(runtime.runPromise),
            teamMetadata: teamMedataEffect.pipe(runtime.runPromise),
            memberMetadata: memberMedataEffect.pipe(runtime.runPromise)
        };
    }

    const [issueList, teamMetadata, memberMetadata] = await Effect.all(
        [issueListEffect, teamMedataEffect, memberMedataEffect],
        {
            concurrency: 'unbounded'
        }
    ).pipe(runtime.runPromise);

    return {
        project: {
            ...data.project,
            description: exit.value.description,
            createdTime: exit.value.createdTime
        },
        issueList,
        teamMetadata,
        memberMetadata
    };
};

const fetchIssueList = (projectId: string) => {
    return Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(`issues`, {
                query: createIssueListQueryParams(() => ({ projectId }))
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
