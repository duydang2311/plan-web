import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';
import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

export default defineConfig({
    plugins: [
        devtoolsJson(),
        tailwindcss(),
        sveltekit(),
        Icons({
            compiler: 'svelte',
            customCollections: {
                custom: FileSystemIconLoader('./src/lib/assets/images/icons')
            }
        })
    ]
});
