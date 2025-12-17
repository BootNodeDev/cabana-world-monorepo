import { deposit, TokenName, TransactionResult } from '@lemoncash/mini-app-sdk'
import { useState } from 'react'
import { useLemonContext } from '../providers/LemonProvider'
import { useLemonUsdcBalance } from '../hooks'

/**
 * Fixed deposit amounts in USDC
 */
const FIXED_AMOUNTS = [10, 20, 50, 100] as const

/**
 * Displays deposit buttons for fixed amounts and custom input
 * Allows moving USDC from Lemon account to mini-app wallet
 */
export const LemonDeposit = () => {
  const { wallet, isConnected, isWebView } = useLemonContext()
  const { refetch: refetchBalance } = useLemonUsdcBalance()
  const [customAmount, setCustomAmount] = useState<string>('')
  const [isDepositing, setIsDepositing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

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

    setIsDepositing(true)
    setError(null)

    try {
      // Convert amount to string for SDK (it expects string representation)
      const amountString = amountNum.toString()

      const result = await deposit({
        amount: amountString,
        tokenName: TokenName.USDC,
        chainId: 8453 // Base chain ID
      })

      if (result.result === TransactionResult.SUCCESS) {
        // Refetch balance after successful deposit
        await refetchBalance()
        setCustomAmount('') // Clear custom input
      } else if (result.result === TransactionResult.FAILED) {
        setError(result.error.message || 'Deposit failed')
      } else if (result.result === TransactionResult.CANCELLED) {
        setError('Deposit cancelled by user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsDepositing(false)
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Deposit USDC</h3>

      <div className="space-y-4">
        {/* Fixed amount buttons */}
        <div className="grid grid-cols-2 gap-2">
          {FIXED_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => handleDeposit(amount.toString())}
              disabled={isDepositing}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              ${amount} USDC
            </button>
          ))}
        </div>

        {/* Custom amount input */}
        <div className="space-y-2">
          <div className="flex gap-2">
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
              disabled={isDepositing}
              className="flex-1 px-3 py-2 border rounded disabled:bg-gray-100"
            />
            <button
              onClick={() => handleDeposit(customAmount)}
              disabled={isDepositing || !customAmount || parseFloat(customAmount) <= 0}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Deposit
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Loading indicator */}
        {isDepositing && (
          <div className="text-center text-gray-500">
            Processing deposit...
          </div>
        )}
      </div>
    </div>
  )
}

