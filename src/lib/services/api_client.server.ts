import { Context, Effect } from 'effect';
import { ApiError } from '~/lib/models/errors';

type RequestRecord = Record<string, number | string | boolean>;
type RequestArray = (boolean | string | number | RequestRecord)[];

interface ApiClientOptions {
	baseUrl: string;
	version: string;
}

interface ApiClientFetchRequestInit extends Omit<RequestInit, 'body'> {
	query?: RequestRecord;
	body?: RequestInit['body'] | RequestRecord | RequestArray;
}

export interface ApiClient {
	fetch(path: string, init?: ApiClientFetchRequestInit): Effect.Effect<Response, ApiError>;
	get(path: string, init?: ApiClientFetchRequestInit): Effect.Effect<Response, ApiError>;
	post(path: string, init?: ApiClientFetchRequestInit): Effect.Effect<Response, ApiError>;
}

export class ApiClientTag extends Context.Tag('ApiClient')<ApiClientTag, ApiClient>() {}

export class HttpApiClient implements ApiClient {
	public constructor(private readonly _options: ApiClientOptions) {}

	public fetch(path: string, init?: ApiClientFetchRequestInit): Effect.Effect<Response, ApiError> {
		return Effect.gen(this, function* () {
			if (isRecordOrArray(init?.body)) {
				init.body = isRecordOrArray(init.body) ? JSON.stringify(init.body) : init.body;
				init.headers = { 'Content-Type': 'application/json', ...init.headers };
			}
			return yield* Effect.tryPromise({
				try: (signal) =>
					fetch(this._buildUrl(path, init?.query), {
						...(init as RequestInit),
						signal: init?.signal ?? signal
					}),
				catch: catchError
			});
		});
	}

	get(
		path: string,
		init?: ApiClientFetchRequestInit | undefined
	): Effect.Effect<Response, ApiError> {
		return this.fetch(path, { method: 'get', ...init });
	}

	post(
		path: string,
		init?: ApiClientFetchRequestInit | undefined
	): Effect.Effect<Response, ApiError> {
		return this.fetch(path, { method: 'post', ...init });
	}

	private _buildUrl(path: string, query?: RequestRecord) {
		const url = `${this._options.baseUrl}/${trim(path, '/')}/${this._options.version}`;
		console.log('url is', url);
		if (query) {
			return `${url}?${Object.entries(query)
				.map((k, v) => `${k}=${v}`)
				.join('&')}`;
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
	return prototype === null || prototype.constructor === Object;
}

function catchError(e: unknown) {
	if (e instanceof ApiError) {
		return e;
	}
	if (e instanceof Error) {
		return new ApiError({ code: 'unknown', message: e.message, cause: e.cause, stack: e.stack });
	}
	return new ApiError({ code: 'unknown', message: e?.toString(), cause: e });
}
