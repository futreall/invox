import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from '@tanstack/react-router'
import * as React from 'react'
import { WagmiProvider } from 'wagmi'
import { getWagmiConfig } from '#wagmi.config.ts'
import css from './styles.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ title: 'InvoX · Tempo Payments' },
		],
		links: [
			{ rel: 'stylesheet', href: css },
			{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
		],
	}),
	component: RootDocument,
})

function RootDocument(): React.JSX.Element {
	const { queryClient } = Route.useRouteContext()
	const [config] = React.useState(() => getWagmiConfig())

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<WagmiProvider config={config}>
					<QueryClientProvider client={queryClient}>
						<Outlet />
					</QueryClientProvider>
				</WagmiProvider>
				<Scripts />
			</body>
		</html>
	)
}
