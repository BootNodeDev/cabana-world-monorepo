import { deposit, TokenName, TransactionResult } from '@lemoncash/mini-app-sdk'
import { useState } from 'react'
import { formatUnits } from 'viem'
import { useLemonContext } from '../providers/LemonProvider'
import { useLemonUsdcBalance } from '../hooks'
import { FundsInput } from './FundsInput'

/**
 * Component for depositing USDC from Lemon account to mini-app wallet
 */
export const LemonDeposit = () => {
    const { wallet, isConnected } = useLemonContext()
    const { data: usdcBalance, refetch: refetchBalance, isRefetching } = useLemonUsdcBalance()
    const [customAmount, setCustomAmount] = useState<string>('')
    const [error, setError] = useState<string | null>(null)

    // Calculate available balance in USDC
    const availableBalance = usdcBalance
        ? parseFloat(formatUnits(usdcBalance.amount, usdcBalance.decimals))
        : 0

    // Handle deposit transaction
    const handleDeposit = async () => {
        if (!isConnected || !wallet) {
            setError('Wallet not connected')
            return
        }

        const amountNum = parseFloat(customAmount)
        if (isNaN(amountNum) || amountNum <= 0) {
            setError('Invalid amount')
            return
        }

        setError(null)

        try {
            const amountString = amountNum.toString()

            const result = await deposit({
                amount: amountString,
                tokenName: TokenName.USDC,
                chainId: 8453 // Base chain ID
            })

            if (result.result === TransactionResult.SUCCESS) {
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
        }
    }

    if (!isConnected) {
        return null
    }

    return (
        <FundsInput
            value={customAmount}
            onChange={(value) => {
                setCustomAmount(value)
                setError(null)
            }}
            onMaxClick={undefined} // Max button not shown in deposit mode for Lemon
            onActionClick={handleDeposit}
            availableBalance={availableBalance}
            isProcessing={false}
            isLoading={isRefetching}
            error={error}
            actionLabel="Deposit"
            actionButtonClassName="bg-blue-500 hover:bg-blue-600"
            placeholder="Custom amount"
            disabled={isRefetching}
        />
    )
}

