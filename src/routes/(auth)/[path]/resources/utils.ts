import type { Context } from 'effect';
import { errorCodes } from '~/lib/models/errors';
import type { HttpClient } from '~/lib/services/http_client';
import { attempt, type Attempt } from '~/lib/utils/try';

export const createUploads =
    (api: Context.Tag.Service<HttpClient>) => async (workspaceId: string, files: File[]) => {
        const getUrlsAttempt = await attempt.promise(() =>
            api.post('workspace-resources/batch-upload-urls', {
                body: {
                    workspaceId,
                    keys: files.map((a) => a.name)
                }
            })
        )(errorCodes.fromFetch);
        if (!getUrlsAttempt.ok || !getUrlsAttempt.data.ok) {
            return attempt.fail(
                !getUrlsAttempt.ok ? getUrlsAttempt.error : getUrlsAttempt.data.status + ''
            );
        }

        const jsonAttempt = await attempt.promise(() =>
            getUrlsAttempt.data.json<{
                results: { url: string; key: string; pendingUploadId: number }[];
            }>()
        )(errorCodes.fromJson);
        if (!jsonAttempt.ok) {
            return attempt.fail(jsonAttempt.error);
        }

        const enrichedResults = jsonAttempt.data.results.map((result, i) => ({
            ...result,
            file: files[i]
        }));

        const uploads = enrichedResults.map((a) => {
            const xhr = new XMLHttpRequest();
            const promise = new Promise<Attempt<void, string>>((resolve) => {
                xhr.timeout = 2 * 1000 * 60;
                xhr.open('PUT', a.url, true);
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(attempt.ok<void>(undefined));
                    } else {
                        resolve(attempt.fail(xhr.status + ''));
                    }
                    resolve(attempt.ok<void>(void 0));
                };
                xhr.ontimeout = () => {
                    resolve(attempt.fail(errorCodes.timeout));
                };
                xhr.onerror = () => {
                    resolve(attempt.fail(errorCodes.network));
                };
                xhr.onabort = () => {
                    resolve(attempt.fail(errorCodes.aborted));
                };
            });
            return {
                ...a,
                xhr,
                promise
            };
        });

        return attempt.ok(uploads);
    };
