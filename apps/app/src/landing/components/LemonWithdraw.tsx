import { withdraw, TokenName, TransactionResult } from '@lemoncash/mini-app-sdk'
import { useState } from 'react'
import { formatUnits } from 'viem'
import { useLemonContext } from '../providers/LemonProvider'
import { useLemonUsdcBalance } from '../hooks'
import { FundsInput } from './FundsInput'

/**
 * Component for withdrawing USDC from mini-app wallet to Lemon account
 */
export const LemonWithdraw = () => {
  const { wallet, isConnected } = useLemonContext()
  const { data: usdcBalance, refetch: refetchBalance, isRefetching } = useLemonUsdcBalance()
  const [customAmount, setCustomAmount] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Calculate available balance in USDC
  const availableBalance = usdcBalance
    ? parseFloat(formatUnits(usdcBalance.amount, usdcBalance.decimals))
    : 0

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

  // Handle withdraw transaction
  const handleWithdraw = async () => {
    if (!isConnected || !wallet) {
      setError('Wallet not connected')
      return
    }

    const amountNum = parseFloat(customAmount)
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

    try {
      const amountString = amountNum.toString()

      const result = await withdraw({
        amount: amountString,
        tokenName: TokenName.USDC
      })

      if (result.result === TransactionResult.SUCCESS) {
        setTimeout(() => {
          refetchBalance()
        }, 2000)
        setCustomAmount('')
      } else if (result.result === TransactionResult.FAILED) {
        setError(result.error.message || 'Withdraw failed')
      } else if (result.result === TransactionResult.CANCELLED) {
        setError('Withdraw cancelled by user')
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
      onMaxClick={handleMaxClick}
      onActionClick={handleWithdraw}
      availableBalance={availableBalance}
      isProcessing={false}
      isLoading={isRefetching}
      error={error}
      actionLabel="Withdraw"
      actionButtonClassName="bg-red-500 hover:bg-red-600"
      placeholder="Amount"
      inputMax={availableBalance}
      disabled={isRefetching}
    />
  )
}

