import { cloudflare } from '@cloudflare/vite-plugin'
import tailwind from '@tailwindcss/vite'
import { tanstackStart as tanstack } from '@tanstack/react-start/plugin/vite'
import Icons from 'unplugin-icons/vite'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [
		cloudflare({ viteEnvironment: { name: 'ssr' } }),
		tailwind(),
		Icons({ compiler: 'jsx', jsx: 'react' }),
		tanstack(),
	],
	server: {
		port: 3001,
	},
})
