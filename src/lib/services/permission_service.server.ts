import { CacheableMemory } from 'cacheable';
import { Context, Effect, Layer } from 'effect';
import { HttpError, type ApiError } from '../models/errors';
import type { PaginatedList } from '../models/paginatedList';
import { ApiClient } from './api_client.server';

const cacheable = new CacheableMemory({
    ttl: '1h',
    useClone: false,
    lruSize: 1024
});

export class PermissionService extends Context.Tag('@app/Permission')<
    PermissionService,
    {
        getProjectPermissions(
            projectId: string,
            userId: string
        ): Effect.Effect<PaginatedList<string>, ApiError | HttpError>;
        getWorkspacePermissions(
            workspaceId: string,
            userId: string
        ): Effect.Effect<PaginatedList<string>, ApiError | HttpError>;
    }
>() {
    public static readonly Live = Layer.effect(
        PermissionService,
        Effect.gen(function* () {
            const api = yield* ApiClient;
            return {
                getProjectPermissions: (projectId: string, userId: string) => {
                    return Effect.gen(function* () {
                        const key = `pj-perms:${projectId}:${userId}`;
                        let list = cacheable.get<PaginatedList<string>>(key);
                        if (!list) {
                            const response = yield* api.get(
                                `project-members/${projectId}/${userId}/permissions`
                            );
                            if (!response.ok) {
                                return yield* Effect.fail(HttpError.from(response));
                            }
                            list = yield* Effect.promise(() =>
                                response.json<PaginatedList<string>>()
                            );
                            cacheable.set(key, list);
                        }
                        return list;
                    });
                },
                getWorkspacePermissions: (workspaceId: string, userId: string) => {
                    return Effect.gen(function* () {
                        const key = `ws-perms:${workspaceId}:${userId}`;
                        let list = cacheable.get<PaginatedList<string>>(key);
                        if (!list) {
                            const response = yield* api.get(
                                `workspace-members/${workspaceId}/${userId}/permissions`
                            );
                            if (!response.ok) {
                                return yield* Effect.fail(HttpError.from(response));
                            }
                            list = yield* Effect.promise(() =>
                                response.json<PaginatedList<string>>()
                            );
                            cacheable.set(key, list);
                        }
                        return list;
                    });
                }
            };
        })
    );
}
