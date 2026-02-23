import { tempoModerato } from 'viem/chains'
import {
	cookieStorage,
	createConfig,
	createStorage,
	http,
	injected,
} from 'wagmi'

export function getWagmiConfig() {
	return createConfig({
		ssr: true,
		chains: [tempoModerato],
		connectors: [injected()],
		storage: createStorage({ storage: cookieStorage }),
		transports: {
			[tempoModerato.id]: http('https://rpc.moderato.tempo.xyz'),
		},
	})
}

declare module 'wagmi' {
	interface Register {
		config: ReturnType<typeof getWagmiConfig>
	}
}
