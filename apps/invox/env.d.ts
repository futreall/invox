interface ImportMetaEnv {
	readonly VITE_TEMPO_ENV: 'moderato' | 'devnet' | 'testnet' | 'presto'
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
