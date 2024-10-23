// See https://kit.svelte.dev/docs/types#app

import type { Layer } from 'effect/Layer';
import type { ManagedRuntime } from 'effect/ManagedRuntime';
import 'unplugin-icons/types/svelte';
import type { Api } from './lib/api/server';
import type { ApiClient } from './lib/services/api_client.server';
import type { Cloudinary } from './lib/services/cloudinary.server';

// for information about these interfaces
declare global {
    type MaybePromise<T> = T | PromiseLike<T>;

    namespace App {
        interface Error {
            code: string;
        }

        interface Locals {
            runtime: ManagedRuntime<ApiClient | Cloudinary, never>;
            appLive: Layer<ApiClient | Cloudinary>;
            user: {
                id: string;
            };
            api: Api;
        }
        interface PageData {
            routes?: (
                | { breadcrumb?: never }
                | { breadcrumb: true; meta: { title: string; href: string } }
            )[];
        }
        interface PageState {
            showInvitationDialog?: boolean;
        }
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
