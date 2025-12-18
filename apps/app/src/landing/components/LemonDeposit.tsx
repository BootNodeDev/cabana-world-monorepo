import { deposit, withdraw, TokenName, TransactionResult } from '@lemoncash/mini-app-sdk'
import { useMemo, useState } from 'react'
import { formatUnits } from 'viem'
import { useLemonContext } from '../providers/LemonProvider'
import { useLemonUsdcBalance } from '../hooks'

/**
 * Fixed deposit amounts in USDC
 */
//const FIXED_AMOUNTS = [1, 2, 5, 10] as const

type Mode = 'deposit' | 'withdraw'

/**
 * Unified component for deposit and withdraw with toggle
 * Allows moving USDC between Lemon account and mini-app wallet
 */
export const LemonDeposit = () => {
  const { wallet, isConnected } = useLemonContext()
  const { data: usdcBalance, refetch: refetchBalance, isRefetching } = useLemonUsdcBalance()
  const [mode, setMode] = useState<Mode>('deposit')
  const [customAmount, setCustomAmount] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

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

  // Handle deposit transaction
  const handleDeposit = async (amount: string) => {
    if (!isConnected || !wallet) {
      setError('Wallet not connected')
      return
    }

    const amountNum = parseFloat(amount)
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

  // Reset error when switching modes
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
    setError(null)
    setCustomAmount('')
  }

  if (!isConnected) {
    return null
  }

  const isDepositMode = mode === 'deposit'

  return (
    <div>
      {/* Toggle between deposit and withdraw */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {isDepositMode ? 'Deposit USDC' : 'Withdraw USDC'}
        </h3>
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleModeChange('deposit')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${isDepositMode
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Deposit
          </button>
          <button
            onClick={() => handleModeChange('withdraw')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${!isDepositMode
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Withdraw
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Fixed amount buttons - only shown in deposit mode */}
        {/* {isDepositMode && (
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-2 sm:gap-2">
            {FIXED_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => handleDeposit(amount.toString())}
                disabled={isRefetching}
                className="px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                ${amount}
              </button>
            ))}
          </div>
        )} */}

        {/* Custom amount input */}
        <div className="space-y-2">
          {/* Show available balance in withdraw mode */}
          {!isDepositMode && (
            <div className="text-sm bg-gray-800 text-white px-3 py-2 rounded">
              Available: <span className="font-semibold">{formatBalance(availableBalance)} USDC</span>
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value)
                  setError(null)
                }}
                placeholder={isDepositMode ? 'Custom amount' : 'Amount'}
                min="0"
                step="0.01"
                max={!isDepositMode ? availableBalance : undefined}
                disabled={isRefetching}
                className="w-full px-3 py-2 border rounded disabled:bg-gray-100 pr-16 text-black"
              />
              {!isDepositMode && availableBalance > 0 && (
                <button
                  onClick={handleMaxClick}
                  disabled={isRefetching}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Max
                </button>
              )}
            </div>
            <button
              onClick={() => (isDepositMode ? handleDeposit(customAmount) : handleWithdraw())}
              disabled={
                isRefetching ||
                !customAmount ||
                parseFloat(customAmount) <= 0 ||
                (!isDepositMode && parseFloat(customAmount) > availableBalance)
              }
              className={`px-4 py-2 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed ${isDepositMode
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-red-500 hover:bg-red-600'
                }`}
            >
              {isDepositMode
                ? 'Deposit'
                : 'Withdraw'}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>
        )}

        {/* Loading indicator */}
        {isRefetching && (
          <div className="text-center text-gray-500">
            Refreshing balance...
          </div>
        )}
      </div>
    </div>
  )
}
