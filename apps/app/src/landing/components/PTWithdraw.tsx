import { callSmartContract, TransactionResult } from '@lemoncash/mini-app-sdk'
import { useUserVaultTokenBalance } from '@generationsoftware/hyperstructure-react-hooks'
import { useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { Address } from 'viem'
import { useLemonContext } from '../providers/LemonProvider'
import { usePoolTogetherContext } from '../providers/PoolTogetherProvider'
import { useLemonUsdcBalance } from '../hooks/useLemonUsdcBalance'
import { FundsInput } from './FundsInput'

/**
 * Component for withdrawing USDC from PoolTogether vault to Lemon account
 */
export const PTWithdraw = () => {
  const { wallet, isConnected } = useLemonContext()
  const { vault, tokenAddress, tokenDecimals } = usePoolTogetherContext()
  const { refetch: refetchBalance } = useLemonUsdcBalance()

  // Get user's vault token balance for withdraw
  const { data: vaultTokenBalance, refetch: refetchVaultBalance, isFetched: isFetchedVaultBalance } = useUserVaultTokenBalance(
    vault!,
    wallet as Address,
    undefined
  )

  const [customAmount, setCustomAmount] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  // Calculate available balance in USDC
  const availableBalance = vaultTokenBalance
    ? parseFloat(formatUnits(vaultTokenBalance.amount, vaultTokenBalance.decimals))
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
            contractAddress: vault.address.toLowerCase() as `0x${string}`,
            functionName: 'withdraw',
            functionParams: [amountWeiString, wallet.toLowerCase() as `0x${string}`, wallet.toLowerCase() as `0x${string}`],
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

  if (!isConnected || !vault || !tokenAddress || !tokenDecimals) {
    return null
  }

  const isLoading = !isFetchedVaultBalance

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
      isProcessing={isProcessing}
      isLoading={isLoading}
      error={error}
      actionLabel="Rescatar"
      actionButtonClassName="bg-red-500 hover:bg-red-600"
      placeholder="Amount"
      inputMax={availableBalance}
      disabled={isProcessing || isLoading}
      processingLabel="Processing..."
    />
  )
}

