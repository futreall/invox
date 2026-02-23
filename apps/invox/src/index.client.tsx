import { StartClient } from '@tanstack/react-start/client'
import * as React from 'react'
import { hydrateRoot } from 'react-dom/client'
import { getRouter } from '#router.tsx'

const router = getRouter()

hydrateRoot(
	document,
	<React.StrictMode>
		<StartClient router={router} />
	</React.StrictMode>,
)
