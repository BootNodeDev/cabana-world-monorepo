import { callSmartContract, TransactionResult } from '@lemoncash/mini-app-sdk'
import { useMemo, useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { useLemonContext } from '../providers/LemonProvider'
import { usePoolTogetherContext } from '../providers/PoolTogetherProvider'
import { useLemonUsdcBalance } from '../hooks/useLemonUsdcBalance'

/**
 * Component that allows depositing USDC from Lemon wallet to PoolTogether vault
 * Uses Lemon's callSmartContract to execute approve + deposit transactions
 */
export const LemonVaultDeposit = () => {
    const { wallet, isConnected } = useLemonContext()
    const { vault, tokenAddress, tokenDecimals } = usePoolTogetherContext()
    const { data: usdcBalance, refetch: refetchBalance, isRefetching: isRefetchingBalance } = useLemonUsdcBalance()

    const [customAmount, setCustomAmount] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState<boolean>(false)

    // Calculate available balance in USDC
    const availableBalance = useMemo(() => {
        if (!usdcBalance) return 0
        return parseFloat(formatUnits(usdcBalance.amount, usdcBalance.decimals))
    }, [usdcBalance])

    // Format balance for display
    const formatBalance = (balance: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(balance)
    }

    // Handle max button click
    const handleMaxClick = () => {
        if (availableBalance > 0) {
            setCustomAmount(availableBalance.toString())
            setError(null)
        }
    }

    // Handle deposit to vault transaction
    const handleDepositToVault = async (amount: string) => {
        if (!isConnected || !wallet || !vault) {
            setError('Wallet or vault not available')
            return
        }

        const amountNum = parseFloat(amount)
        if (isNaN(amountNum) || amountNum <= 0) {
            setError('Invalid amount')
            return
        }

        // Validate that amount doesn't exceed available balance
        if (amountNum > availableBalance) {
            setError(`Insufficient balance. Available: ${formatBalance(availableBalance)} USDC`)
            return
        }

        setError(null)
        setIsProcessing(true)

        if (!tokenAddress || !tokenDecimals) {
            setError('Token information not available')
            setIsProcessing(false)
            return
        }

        try {
            // Convert amount to wei using token decimals from vault
            const amountWei = parseUnits(amountNum.toFixed(tokenDecimals), tokenDecimals)
            const amountWeiString = amountWei.toString()

            // Always include approve + deposit in batch transaction
            const contracts: Array<{
                contractAddress: `0x${string}`
                functionName: string
                functionParams: (string | number)[]
                value: string
            }> = [
                    // Approve token to vault
                    {
                        contractAddress: tokenAddress,
                        functionName: 'approve',
                        functionParams: [vault.address, amountWeiString],
                        value: '0'
                    },
                    // Deposit to vault
                    {
                        contractAddress: vault.address,
                        functionName: 'deposit',
                        functionParams: [amountWeiString, wallet],
                        value: '0'
                    }
                ]

            // Execute batch transaction via Lemon SDK
            const result = await callSmartContract({
                contracts,
            })

            if (result.result === TransactionResult.SUCCESS) {
                // Wait a bit for blockchain to update
                setTimeout(() => {
                    refetchBalance()
                }, 2000)
                setCustomAmount('')
            } else if (result.result === TransactionResult.FAILED) {
                setError(result.error.message || 'Deposit failed')
            } else if (result.result === TransactionResult.CANCELLED) {
                setError('Deposit cancelled by user')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred')
        } finally {
            setIsProcessing(false)
        }
    }

    if (!isConnected || !vault || !tokenAddress || !tokenDecimals) {
        return null
    }

    const isLoading = isRefetchingBalance

    return (
        <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold">Deposit to PoolTogether Vault</h3>

            <div className="space-y-4">
                {/* Available balance display */}
                <div className="text-sm px-3 py-2 rounded border">
                    Available: <span className="font-semibold">{formatBalance(availableBalance)} USDC</span>
                </div>

                {/* Custom amount input */}
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="number"
                                value={customAmount}
                                onChange={(e) => {
                                    setCustomAmount(e.target.value)
                                    setError(null)
                                }}
                                placeholder="Custom amount"
                                min="0"
                                step="0.01"
                                max={availableBalance}
                                disabled={isProcessing || isLoading}
                                className="w-full px-3 py-2 border rounded pr-16 disabled:cursor-not-allowed text-black"
                            />
                            {availableBalance > 0 && (
                                <button
                                    onClick={handleMaxClick}
                                    disabled={isProcessing || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium disabled:cursor-not-allowed"
                                >
                                    Max
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => handleDepositToVault(customAmount)}
                            disabled={
                                isProcessing ||
                                isLoading ||
                                !customAmount ||
                                parseFloat(customAmount) <= 0 ||
                                parseFloat(customAmount) > availableBalance
                            }
                            className="px-4 py-2 border rounded disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'Processing...' : 'Deposit'}
                        </button>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="p-2 border rounded text-sm">{error}</div>
                )}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="text-center text-sm">
                        Loading balance...
                    </div>
                )}
            </div>
        </div>
    )
}

