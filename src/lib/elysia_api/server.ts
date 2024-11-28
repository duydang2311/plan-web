import { env } from '$env/dynamic/private';
import { ValueErrorType } from '@sinclair/typebox/errors';
import { Layer, ManagedRuntime } from 'effect';
import { Elysia } from 'elysia';
import { ApiClient, HttpApiClient } from '../services/api_client.server';
import { UniversalHttpClient } from '../services/universal_http_client';
import { CloudinaryLive, ErrorFnLive } from './contexts';
import { issueComments } from './routes/issue_comments';
import { issues } from './routes/issues';
import { teamMembers } from './routes/team_members';
import { teams } from './routes/teams';
import { users } from './routes/users';
import { workspaceStatuses } from './routes/workspace-statuses';
import { workspaces } from './routes/workspaces';

const baseApp = new Elysia({ prefix: '/api' })
    .state(
        'runtime',
        ManagedRuntime.make(
            Layer.mergeAll(
                Layer.sync(
                    ApiClient,
                    () =>
                        new HttpApiClient({
                            httpClient: new UniversalHttpClient({
                                baseUrl: env.API_BASE_URL,
                                version: env.API_VERSION,
                                fetch: globalThis.fetch
                            })
                        })
                ),
                ErrorFnLive,
                CloudinaryLive
            )
        )
    )
    .onError((e) => {
        switch (e.code) {
            case 'PARSE':
                return { errors: { body: ['parse'] } };
            case 'VALIDATION': {
                const errors: Record<string, string[]> = {};
                for (const error of e.error.validator.Errors(e.error.value)) {
                    const path = error.path.length === 0 ? '/' : error.path;
                    if (!errors[path]) {
                        errors[path] = [ValueErrorType[error.type]];
                    } else {
                        errors[path].push(ValueErrorType[error.type]);
                    }
                }
                return errors;
            }
        }
    });

export type BaseApp = typeof baseApp;

export const app = baseApp
    .use(users)
    .use(workspaces)
    .use(issues)
    .use(issueComments)
    .use(teamMembers)
    .use(workspaceStatuses)
    .use(teams);
