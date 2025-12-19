import { callSmartContract, TransactionResult } from '@lemoncash/mini-app-sdk'
import { useUserVaultTokenBalance } from '@generationsoftware/hyperstructure-react-hooks'
import { useMemo, useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { Address } from 'viem'
import { useLemonContext } from '../providers/LemonProvider'
import { usePoolTogetherContext } from '../providers/PoolTogetherProvider'
import { useLemonUsdcBalance } from '../hooks/useLemonUsdcBalance'

type Mode = 'deposit' | 'withdraw'

/**
 * Unified component for deposit and withdraw with toggle
 * Allows moving USDC between Lemon account and PoolTogether vault
 * Uses Lemon's callSmartContract to execute transactions
 */
export const PTDepositWithdraw = () => {
  const { wallet, isConnected } = useLemonContext()
  const { vault, tokenAddress, tokenDecimals } = usePoolTogetherContext()
  const { data: usdcBalance, refetch: refetchBalance, isRefetching: isRefetchingBalance } = useLemonUsdcBalance()
  
  // Get user's vault token balance for withdraw
  const { data: vaultTokenBalance, refetch: refetchVaultBalance, isRefetching: isRefetchingVaultBalance } = useUserVaultTokenBalance(
    vault!,
    wallet as Address,
    undefined
  )

  const [mode, setMode] = useState<Mode>('deposit')
  const [customAmount, setCustomAmount] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  // Calculate available balance in USDC (from Lemon wallet for deposit, from vault for withdraw)
  const availableBalance = useMemo(() => {
    if (mode === 'deposit') {
      if (!usdcBalance) return 0
      return parseFloat(formatUnits(usdcBalance.amount, usdcBalance.decimals))
    } else {
      if (!vaultTokenBalance) return 0
      return parseFloat(formatUnits(vaultTokenBalance.amount, vaultTokenBalance.decimals))
    }
  }, [usdcBalance, vaultTokenBalance, mode])

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
  const handleDeposit = async (amount: string) => {
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

      // Execute batch transaction via Lemon SDK
      const result = await callSmartContract({
        contracts: [
          {
            contractAddress: tokenAddress,
            functionName: 'approve',
            functionParams: [vault.address, amountWeiString],
            value: '0',
            chainId: 8453
          },
          {
            contractAddress: vault.address,
            functionName: 'deposit',
            functionParams: [amountWeiString, wallet],
            value: '0',
            chainId: 8453
          }
        ],
      })

      if (result.result === TransactionResult.SUCCESS) {
        // Wait a bit for blockchain to update
        setTimeout(() => {
          refetchBalance()
          refetchVaultBalance()
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

  // Handle withdraw from vault transaction
  const handleWithdraw = async () => {
    if (!isConnected || !wallet || !vault) {
      setError('Wallet or vault not available')
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

      // Execute withdraw transaction via Lemon SDK
      // withdraw(uint256 _assets, address _receiver, address _owner)
      const result = await callSmartContract({
        contracts: [
          {
            contractAddress: vault.address,
            functionName: 'withdraw',
            functionParams: [amountWeiString, wallet, wallet],
            value: '0',
            chainId: 8453
          }
        ],
      })

      if (result.result === TransactionResult.SUCCESS) {
        // Wait a bit for blockchain to update
        setTimeout(() => {
          refetchBalance()
          refetchVaultBalance()
        }, 2000)
        setCustomAmount('')
      } else if (result.result === TransactionResult.FAILED) {
        setError(result.error.message || 'Withdraw failed')
      } else if (result.result === TransactionResult.CANCELLED) {
        setError('Withdraw cancelled by user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  // Reset error when switching modes
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
    setError(null)
    setCustomAmount('')
  }

  if (!isConnected || !vault || !tokenAddress || !tokenDecimals) {
    return null
  }

  const isDepositMode = mode === 'deposit'
  const isLoading = isRefetchingBalance || isRefetchingVaultBalance

  return (
    <div>
      {/* Toggle between deposit and withdraw */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {isDepositMode ? 'Invertir USDC' : 'Rescatar USDC'}
        </h3>
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleModeChange('deposit')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${isDepositMode
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Invertir
          </button>
          <button
            onClick={() => handleModeChange('withdraw')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${!isDepositMode
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Rescatar
          </button>
        </div>
      </div>

      <div className="space-y-4">
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
                placeholder={isDepositMode ? 'Custom amount' : 'Amount'}
                min="0"
                step="0.01"
                max={availableBalance}
                disabled={isProcessing || isLoading}
                className="w-full px-3 py-2 border rounded disabled:bg-gray-100 pr-16 text-black"
              />
              {availableBalance > 0 && (
                <button
                  onClick={handleMaxClick}
                  disabled={isProcessing || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Max
                </button>
              )}
            </div>
            <button
              onClick={() => (isDepositMode ? handleDeposit(customAmount) : handleWithdraw())}
              disabled={
                isProcessing ||
                isLoading ||
                !customAmount ||
                parseFloat(customAmount) <= 0 ||
                parseFloat(customAmount) > availableBalance
              }
              className={`px-4 py-2 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed ${isDepositMode
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-red-500 hover:bg-red-600'
                }`}
            >
              {isProcessing
                ? 'Processing...'
                : isDepositMode
                  ? 'Invertir'
                  : 'Rescatar'}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="text-center text-gray-500">
            Refreshing balance...
          </div>
        )}
      </div>
    </div>
  )
}

