import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { formatUnits, parseUnits, type Address } from 'viem'
import { tempoModerato } from 'viem/chains'
import {
	useAccount,
	useConnect,
	useConnectors,
	useDisconnect,
	useReadContract,
	useSwitchChain,
	useWaitForTransactionReceipt,
	useWriteContract,
} from 'wagmi'
import { ERC20_ABI, INVOICE_ABI, INVOICE_CONTRACT_ADDRESS, TOKENS, type Token } from '#lib/contract.ts'

export const Route = createFileRoute('/_layout/')({
	component: InvoicePage,
})

type PayStep = 'idle' | 'approving' | 'paying' | 'done' | 'error'

function InvoicePage(): React.JSX.Element {
	const [mounted, setMounted] = React.useState(false)
	React.useEffect(() => setMounted(true), [])

	const { address, chain } = useAccount()
	const isOnTempo = chain?.id === tempoModerato.id

	const [contractAddress, setContractAddress] = React.useState(INVOICE_CONTRACT_ADDRESS)
	const [token, setToken] = React.useState<Token>(TOKENS[0]!)
	const [amount, setAmount] = React.useState('')
	const [invoiceId, setInvoiceId] = React.useState('')
	const [step, setStep] = React.useState<PayStep>('idle')
	const [approveTxHash, setApproveTxHash] = React.useState<`0x${string}`>()
	const [payTxHash, setPayTxHash] = React.useState<`0x${string}`>()
	const [errorMsg, setErrorMsg] = React.useState('')
	const [dropdownOpen, setDropdownOpen] = React.useState(false)

	const parsedAmount = React.useMemo(() => {
		try { return parseUnits(amount || '0', 6) } catch { return 0n }
	}, [amount])

	const validContract = contractAddress.startsWith('0x') && contractAddress.length === 42

	const { data: balance = 0n } = useReadContract({
		address: token.address,
		abi: ERC20_ABI,
		functionName: 'balanceOf',
		args: [address ?? '0x0'],
		query: { enabled: !!address },
	})

	const { data: allowance = 0n, refetch: refetchAllowance } = useReadContract({
		address: token.address,
		abi: ERC20_ABI,
		functionName: 'allowance',
		args: [address ?? '0x0', contractAddress as Address],
		query: { enabled: !!address && validContract },
	})

	const { writeContractAsync } = useWriteContract()

	const sendPayTx = React.useCallback(async () => {
		setStep('paying')
		try {
			const hash = await writeContractAsync({
				address: contractAddress as Address,
				abi: INVOICE_ABI,
				functionName: 'pay',
				args: [token.address, parsedAmount, invoiceId],
			})
			setPayTxHash(hash)
		} catch (e) {
			setErrorMsg(e instanceof Error ? e.message : 'Transaction rejected')
			setStep('error')
		}
	}, [contractAddress, token.address, parsedAmount, invoiceId, writeContractAsync])

	const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({
		hash: approveTxHash,
	})

	const { isSuccess: payConfirmed } = useWaitForTransactionReceipt({
		hash: payTxHash,
	})

	// После подтверждения approve — отправить pay
	React.useEffect(() => {
		if (approveConfirmed && step === 'approving') {
			void refetchAllowance()
			void sendPayTx()
		}
	}, [approveConfirmed, step, refetchAllowance, sendPayTx])

	// После подтверждения pay — done
	React.useEffect(() => {
		if (payConfirmed && step === 'paying') {
			setStep('done')
		}
	}, [payConfirmed, step])

	const handlePay = async () => {
		setErrorMsg('')
		try {
			if (allowance < parsedAmount) {
				setStep('approving')
				const hash = await writeContractAsync({
					address: token.address,
					abi: ERC20_ABI,
					functionName: 'approve',
					args: [contractAddress as Address, parsedAmount],
				})
				setApproveTxHash(hash)
			} else {
				await sendPayTx()
			}
		} catch (e) {
			setErrorMsg(e instanceof Error ? e.message : 'Transaction rejected')
			setStep('error')
		}
	}

	const reset = () => {
		setStep('idle')
		setPayTxHash(undefined)
		setApproveTxHash(undefined)
		setErrorMsg('')
		setAmount('')
		setInvoiceId('')
	}

	const isLoading = step === 'approving' || step === 'paying'
	const canPay = !!address && isOnTempo && validContract && parsedAmount > 0n && invoiceId.trim().length > 0 && !isLoading

	return (
		<div className="min-h-dvh flex flex-col" style={{ background: 'var(--color-bg)' }}>
			{/* Header */}
			<header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
				<div className="flex items-center gap-3">
					<svg width="28" height="28" viewBox="0 0 32 32" fill="none">
						<rect width="32" height="32" rx="8" fill="#10b981" />
						<text x="16" y="22" fontFamily="system-ui, sans-serif" fontSize="16" fontWeight="700" fill="#000" textAnchor="middle">X</text>
					</svg>
					<span className="text-base font-semibold tracking-tight">InvoX</span>
				</div>
				<ConnectButton />
			</header>

			{/* Main */}
			<main className="flex-1 flex items-start justify-center px-4 pt-12 pb-20">
				<div className="w-full max-w-md">
					{/* Card */}
					<div
						className="rounded-2xl p-6"
						style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
					>
						<h1 className="text-xl font-semibold mb-6">Pay</h1>

						<div className="space-y-5">
							{/* Contract */}
							{!INVOICE_CONTRACT_ADDRESS && (
								<Field label="Contract Address">
									<input
										type="text"
										className="input"
										style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}
										placeholder="0x..."
										value={contractAddress}
										onChange={(e) => setContractAddress(e.target.value)}
										disabled={isLoading}
									/>
								</Field>
							)}

							{/* Token Select */}
							<Field label="Token" right={address ? `${formatUnits(balance, 6)} ${token.symbol}` : undefined}>
								<div className="relative">
									<button
										type="button"
										className="select-trigger"
										onClick={() => setDropdownOpen(!dropdownOpen)}
										disabled={isLoading}
									>
										<div className="flex items-center gap-3">
											<div
												className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
												style={{ background: token.color }}
											>
												{token.icon}
											</div>
											<span>{token.symbol}</span>
										</div>
										<svg
											width="16" height="16" viewBox="0 0 16 16" fill="none"
											style={{ opacity: 0.4, transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
										>
											<path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									</button>

									{dropdownOpen && (
										<div className="select-dropdown">
											{TOKENS.map((t) => (
												<div
													key={t.address}
													className={`select-option ${token.address === t.address ? 'selected' : ''}`}
													onClick={() => { setToken(t); setDropdownOpen(false) }}
												>
													<div
														className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
														style={{ background: t.color }}
													>
														{t.icon}
													</div>
													<div>
														<div className="text-sm font-medium">{t.symbol}</div>
														<div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>{t.name}</div>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							</Field>

							{/* Amount */}
							<Field label="Amount">
								<div className="relative">
									<input
										type="number"
										className="input"
										style={{ paddingRight: '80px' }}
										placeholder="0.00"
										min="0"
										step="0.01"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										disabled={isLoading}
									/>
									<span
										className="absolute right-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
										style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}
									>
										{token.symbol}
									</span>
								</div>
							</Field>

							{/* Invoice ID */}
							<Field label="Invoice ID">
								<input
									type="text"
									className="input"
									placeholder="INV-001"
									value={invoiceId}
									onChange={(e) => setInvoiceId(e.target.value)}
									disabled={isLoading}
								/>
							</Field>

							{/* Error */}
							{step === 'error' && (
								<div
									className="p-4 rounded-xl"
									style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
								>
									<p className="text-sm text-red-400 break-all mb-2">{errorMsg}</p>
									<button
										type="button"
										onClick={reset}
										className="text-sm text-red-400 underline hover:text-red-300"
									>
										Try again
									</button>
								</div>
							)}

							{/* Success */}
							{step === 'done' && payTxHash && (
								<div
									className="p-5 rounded-xl space-y-4"
									style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)' }}
								>
									<div className="flex items-center gap-2">
										<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
											<circle cx="10" cy="10" r="10" fill="#10b981" fillOpacity="0.2" />
											<path d="M6 10L9 13L14 7" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
										<span className="text-base font-semibold" style={{ color: '#10b981' }}>Payment Sent</span>
									</div>

									<div className="space-y-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
										<Row label="Amount" value={`${amount} ${token.symbol}`} />
										<Row label="Invoice" value={invoiceId} mono />
										<Row
											label="Transaction"
											value={
												<a
													href={`https://explore.tempo.xyz/tx/${payTxHash}`}
													target="_blank"
													rel="noreferrer"
													className="hover:underline"
													style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
												>
													{payTxHash.slice(0, 10)}...{payTxHash.slice(-6)} ↗
												</a>
											}
										/>
									</div>

									<button
										type="button"
										onClick={reset}
										className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
										style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'var(--color-text-muted)' }}
										onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
										onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
									>
										New Payment
									</button>
								</div>
							)}

							{/* Pay Button */}
							{step !== 'done' && (
								<button
									type="button"
									onClick={handlePay}
									disabled={!canPay}
									className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all"
									style={{
										background: canPay ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.04)',
										color: canPay ? '#000' : 'var(--color-text-dim)',
										cursor: canPay ? 'pointer' : 'not-allowed',
									}}
									onMouseEnter={(e) => canPay && (e.currentTarget.style.background = 'var(--color-accent-hover)')}
									onMouseLeave={(e) => canPay && (e.currentTarget.style.background = 'var(--color-accent)')}
								>
									{isLoading
										? step === 'approving' ? 'Approving...' : 'Sending...'
										: !address
											? 'Connect Wallet'
											: !isOnTempo
												? 'Switch to Tempo'
												: 'Pay'
									}
								</button>
							)}
						</div>
					</div>

					{/* Footer info */}
					<p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-dim)' }}>
						Tempo Moderato Testnet · Chain 42431
					</p>
				</div>
			</main>
		</div>
	)
}

// ─── Components ───────────────────────────────────────────────────────────────

function ConnectButton(): React.JSX.Element {
	const { address, chain } = useAccount()
	const { connect } = useConnect()
	const { disconnect } = useDisconnect()
	const { switchChain } = useSwitchChain()
	const connectors = useConnectors()

	if (!address) {
		const connector = connectors[0]
		return (
			<button
				type="button"
				onClick={() => connector && connect({ connector })}
				className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
				style={{ background: 'var(--color-accent)', color: '#000' }}
				onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
				onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-accent)')}
			>
				Connect
			</button>
		)
	}

	if (chain?.id !== tempoModerato.id) {
		return (
			<button
				type="button"
				onClick={() => switchChain({ chainId: tempoModerato.id })}
				className="px-4 py-2 rounded-lg text-sm font-medium"
				style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)' }}
			>
				Switch Network
			</button>
		)
	}

	return (
		<button
			type="button"
			onClick={() => disconnect()}
			className="px-4 py-2 rounded-lg text-sm transition-colors"
			style={{ background: 'rgba(255, 255, 255, 0.04)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
			onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
			onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
		>
			{address.slice(0, 6)}...{address.slice(-4)}
		</button>
	)
}

function Field(props: { label: string; right?: string; children: React.ReactNode }): React.JSX.Element {
	return (
		<div>
			<div className="flex items-center justify-between mb-2">
				<label className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{props.label}</label>
				{props.right && (
					<span className="text-xs" style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
						{props.right}
					</span>
				)}
			</div>
			{props.children}
		</div>
	)
}

function Row(props: { label: string; value: React.ReactNode; mono?: boolean }): React.JSX.Element {
	return (
		<div className="flex items-center justify-between">
			<span style={{ color: 'var(--color-text-dim)' }}>{props.label}</span>
			<span style={props.mono ? { fontFamily: 'var(--font-mono)', fontSize: '13px' } : undefined}>{props.value}</span>
		</div>
	)
}
