import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { hashFn } from 'wagmi/query'
import { routeTree } from '#routeTree.gen.ts'

export function getRouter() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1_000,
				queryKeyHashFn: hashFn,
				refetchOnWindowFocus: false,
			},
		},
	})

	return createRouter({
		routeTree,
		context: { queryClient },
		defaultPreload: 'intent',
	})
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
