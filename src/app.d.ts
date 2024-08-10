// See https://kit.svelte.dev/docs/types#app

import type { Layer } from 'effect/Layer';
import type { ManagedRuntime } from 'effect/ManagedRuntime';
import 'unplugin-icons/types/svelte';
import type { ApiClient } from './lib/services/api_client.server';

// for information about these interfaces
declare global {
    type MaybePromise<T> = T | PromiseLike<T>;

    namespace App {
        interface Error {
            code: string;
        }

        interface Locals {
            runtime: ManagedRuntime<ApiClient, never>;
            appLive: Layer<ApiClient>;
            user: {
                id: string;
            };
        }
        interface PageData {
            routes?: (
                | { breadcrumb?: never }
                | { breadcrumb: true; meta: { title: string; href: string } }
            )[];
        }
        // interface PageState { }
        // interface Platform {}
    }

    interface Body {
        json<T = unknown>(): Promise<T>;
    }

    interface FormData {
        get<T = FormDataEntryValue>(name: string): T | null;
        getAll<T = FormDataEntryValue>(name: string): T[];
    }

    namespace Belt {
        type UseMutableArrays = 1;
    }
}
