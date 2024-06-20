// See https://kit.svelte.dev/docs/types#app

import type { Layer } from 'effect';
import type { ApiClientTag } from './lib/services/api_client.server';

// for information about these interfaces
declare global {
	type MaybePromise<T> = T | PromiseLike<T>;

	namespace App {
		// interface Error {}
		interface Locals {
			appLive: Layer.Layer<ApiClientTag>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Body {
		json<T = unknown>(): Promise<T>;
	}

	interface FormData {
		get<T = FormDataEntryValue>(name: string): T | null;
		getAll<T = FormDataEntryValue>(name: string): T[];
	}
}

export {};
