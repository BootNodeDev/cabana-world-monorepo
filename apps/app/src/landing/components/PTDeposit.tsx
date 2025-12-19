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
 * Component for depositing USDC from Lemon account to PoolTogether vault
 */
export const PTDeposit = () => {
  const { wallet, isConnected } = useLemonContext()
  const { vault, tokenAddress, tokenDecimals } = usePoolTogetherContext()
  const { data: usdcBalance, refetch: refetchBalance, isRefetching: isRefetchingBalance } = useLemonUsdcBalance()
  
  // Get vault balance refetch for updating after deposit
  const { refetch: refetchVaultBalance } = useUserVaultTokenBalance(
    vault!,
    wallet as Address,
    undefined
  )

  const [customAmount, setCustomAmount] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

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

  // Handle deposit to vault transaction
  const handleDeposit = async () => {
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

      // Execute batch transaction via Lemon SDK
      const result = await callSmartContract({
        contracts: [
          {
            contractAddress: tokenAddress.toLowerCase() as `0x${string}`,
            functionName: 'approve',
            functionParams: [vault.address.toLowerCase() as `0x${string}`, amountWeiString],
            value: '0',
            chainId: 8453
          },
          {
            contractAddress: vault.address.toLowerCase() as `0x${string}`,
            functionName: 'deposit',
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
    <FundsInput
      value={customAmount}
      onChange={(value) => {
        setCustomAmount(value)
        setError(null)
      }}
      onMaxClick={handleMaxClick}
      onActionClick={handleDeposit}
      availableBalance={availableBalance}
      isProcessing={isProcessing}
      isLoading={isLoading}
      error={error}
      actionLabel="Invertir"
      actionButtonClassName="bg-blue-500 hover:bg-blue-600"
      placeholder="Custom amount"
      inputMax={availableBalance}
      disabled={isProcessing || isLoading}
      processingLabel="Processing..."
    />
  )
}

