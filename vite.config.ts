import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import * as process from 'process';

export default defineConfig(({mode}) => {
	const env = loadEnv(mode, process.cwd(), '');
	return {
		plugins: [sveltekit()],
		server: {
			proxy: {
				'/v1': {
					target: 'https://api.openai.com',
					changeOrigin: true,
					headers: {
						'Authorization': `Bearer ${env.OPENAI_API_KEY}`
					}
				}
			}
		}
	}
});
