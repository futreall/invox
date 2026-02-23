import type { Address } from 'viem'

// ── Invoice contract ABI ──────────────────────────────────────────────────────
export const INVOICE_ABI = [
	{
		type: 'constructor',
		inputs: [{ name: '_owner', type: 'address' }],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'pay',
		inputs: [
			{ name: 'token', type: 'address' },
			{ name: 'amount', type: 'uint256' },
			{ name: 'invoiceId', type: 'string' },
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'owner',
		inputs: [],
		outputs: [{ name: '', type: 'address' }],
		stateMutability: 'view',
	},
	{
		type: 'event',
		name: 'PaymentReceived',
		inputs: [
			{ name: 'sender', type: 'address', indexed: true },
			{ name: 'token', type: 'address', indexed: true },
			{ name: 'amount', type: 'uint256', indexed: false },
			{ name: 'invoiceId', type: 'string', indexed: false },
		],
	},
] as const

// ── ERC-20 minimal ABI ────────────────────────────────────────────────────────
export const ERC20_ABI = [
	{
		type: 'function',
		name: 'approve',
		inputs: [
			{ name: 'spender', type: 'address' },
			{ name: 'amount', type: 'uint256' },
		],
		outputs: [{ name: '', type: 'bool' }],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'allowance',
		inputs: [
			{ name: 'owner', type: 'address' },
			{ name: 'spender', type: 'address' },
		],
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'decimals',
		inputs: [],
		outputs: [{ name: '', type: 'uint8' }],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'balanceOf',
		inputs: [{ name: 'account', type: 'address' }],
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'symbol',
		inputs: [],
		outputs: [{ name: '', type: 'string' }],
		stateMutability: 'view',
	},
] as const

// ── TIP-20 Stablecoins on Tempo Moderato ──────────────────────────────────────
export type Token = {
	address: Address
	symbol: string
	name: string
	color: string
	icon: string
}

export const TOKENS: Token[] = [
	{
		address: '0x20c0000000000000000000000000000000000000',
		symbol: 'PathUSD',
		name: 'Path USD',
		color: '#000000',
		icon: 'ρ',
	},
	{
		address: '0x20c0000000000000000000000000000000000001',
		symbol: 'AlphaUSD',
		name: 'Alpha USD',
		color: '#10b981',
		icon: 'α',
	},
	{
		address: '0x20c0000000000000000000000000000000000002',
		symbol: 'BetaUSD',
		name: 'Beta USD',
		color: '#3b82f6',
		icon: 'β',
	},
	{
		address: '0x20c0000000000000000000000000000000000003',
		symbol: 'ThetaUSD',
		name: 'Theta USD',
		color: '#dc2626',
		icon: 'θ',
	},
]

// ── Deployed contract address on Tempo Moderato ──────────────────────────────
export const INVOICE_CONTRACT_ADDRESS: Address = '0x95274BB0d04cC7F7473732E63664b39e9211FB44'
