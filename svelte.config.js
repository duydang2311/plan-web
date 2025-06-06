import { preprocessMeltUI, sequence } from '@melt-ui/pp';
import adapter from 'svelte-adapter-bun';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
/** @type {import('@sveltejs/kit').Config}*/
const config = {
    // Consult https://kit.svelte.dev/docs/integrations#preprocessors
    // for more information about preprocessors
    preprocess: sequence([vitePreprocess(), preprocessMeltUI()]),
    kit: {
        // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
        // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
        // See https://kit.svelte.dev/docs/adapters for more information about adapters.
        adapter: adapter({
            development: true,
            precompress: {
                brotli: true,
                gzip: true
            }
        }),
        alias: {
            '~': 'src'
        },
        csp: {
            mode: 'auto',
            directives: {
                'script-src': [
                    'self',
                    'unsafe-eval',
                    'unsafe-hashes',
                    'sha256-7dQwUgLau1NFCCGjfn9FsYptB6ZtWxJin6VohGIu20I='
                ]
            }
        },
        csrf: {
            checkOrigin: false
        }
    },
    compilerOptions: {
        runes: true
    },
    vitePlugin: {
        dynamicCompileOptions({ filename }) {
            if (filename.includes('node_modules')) {
                return {
                    runes: undefined
                };
            }
        }
    }
};
export default config;
