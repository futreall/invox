import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout')({
	component: () => (
		<div className="min-h-dvh flex flex-col">
			<Outlet />
		</div>
	),
})
