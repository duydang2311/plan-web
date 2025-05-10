import type { Context } from 'effect';
import { stringifyQuery } from '../utils/url';
import type { HttpClient, HttpClientFetchRequestInit, HttpClientOptions } from './http_client';

type RequestRecord = Record<string, unknown>;
type RequestArray = unknown[];

export class UniversalHttpClient implements Context.Tag.Service<HttpClient> {
    public constructor(
        protected readonly _options: HttpClientOptions & {
            fetch: typeof fetch;
        }
    ) {}

    public fetch(path: string, init?: HttpClientFetchRequestInit) {
        if (init?.body && isRecordOrArray(init.body)) {
            init.body = isRecordOrArray(init.body) ? JSON.stringify(init.body) : init.body;
            let headers = isRecord(init.headers)
                ? init.headers
                : Array.isArray(init.headers)
                  ? Object.fromEntries(init.headers)
                  : init.headers instanceof Headers
                    ? Object.fromEntries(init.headers)
                    : undefined;
            if (init.body != null) {
                headers ??= {};
                headers['Content-Type'] ??= 'application/json';
            }
            if (headers) {
                init.headers = headers;
            }
        }
        return this._options.fetch(this._buildUrl(path, init?.query), init as RequestInit);
    }

    get(path: string, init?: HttpClientFetchRequestInit | undefined) {
        return this.fetch(path, { method: 'get', ...init });
    }

    post(path: string, init?: HttpClientFetchRequestInit | undefined) {
        return this.fetch(path, { method: 'post', ...init });
    }

    head(path: string, init?: HttpClientFetchRequestInit | undefined) {
        return this.fetch(path, { method: 'head', ...init });
    }

    patch(path: string, init?: HttpClientFetchRequestInit | undefined) {
        return this.fetch(path, { method: 'PATCH', ...init });
    }

    delete(path: string, init?: HttpClientFetchRequestInit | undefined) {
        return this.fetch(path, { method: 'delete', ...init });
    }

    put(path: string, init?: HttpClientFetchRequestInit | undefined) {
        return this.fetch(path, { method: 'put', ...init });
    }

    private _buildUrl(path: string, query?: RequestRecord) {
        const url = `${this._options.baseUrl ? `${this._options.baseUrl}/` : ''}${trim(path, '/')}${this._options.version ? `/${this._options.version}` : ''}`;
        if (query) {
            return `${url}${stringifyQuery(query, { includeQuestionMark: true })}`;
        }
        return url;
    }
}

function trim(input: string, char: string) {
    let start = 0;
    let end = input.length;
    while (input[start] === char) ++start;
    while (input[--end] === char);
    if (end < start) end = start - 1;
    return input.substring(start, end + 1);
}

function isRecordOrArray(obj: unknown): obj is RequestRecord | RequestArray {
    if (!obj) return false;
    if (Array.isArray(obj)) return true;
    const prototype = Object.getPrototypeOf(obj) as typeof obj;
    return prototype == null || prototype.constructor === Object;
}

function isRecord(obj: unknown): obj is Record<string, string> {
    if (obj == null) return false;
    const prototype = Object.getPrototypeOf(obj) as typeof obj;
    return prototype == null || prototype.constructor === Object;
}
