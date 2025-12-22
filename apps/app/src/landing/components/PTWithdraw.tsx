import { callSmartContract, TransactionResult } from '@lemoncash/mini-app-sdk'
import { useUserVaultShareBalance, useVaultExchangeRate } from '@generationsoftware/hyperstructure-react-hooks'
import { getSharesFromAssets, getAssetsFromShares } from '@shared/utilities'
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

  // Get user's vault share balance for redeem (following WithdrawTxButton pattern)
  const { data: vaultShareBalance, refetch: refetchVaultBalance, isFetched: isFetchedVaultBalance } = useUserVaultShareBalance(
    vault!,
    wallet as Address,
    undefined
  )

  // Get vault exchange rate to convert between shares and assets (following WithdrawTxButton pattern)
  const { data: vaultExchangeRate, isFetched: isFetchedExchangeRate } = useVaultExchangeRate(vault!)

  const [customAmount, setCustomAmount] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  // Calculate available balance in USDC (convert shares to assets for display)
  // Following the pattern from WithdrawTxButton: getAssetsFromShares(shareBalance, exchangeRate, decimals)
  const availableBalance =
    vaultShareBalance && vaultExchangeRate && tokenDecimals
      ? parseFloat(
          formatUnits(
            getAssetsFromShares(vaultShareBalance.amount, vaultExchangeRate, tokenDecimals),
            tokenDecimals
          )
        )
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

  // Handle redeem from vault transaction (following WithdrawTxButton pattern)
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

    if (!tokenAddress || !tokenDecimals || !vaultExchangeRate) {
      setError('Token information or exchange rate not available')
      setIsProcessing(false)
      return
    }

    try {
      // Convert user input (assets) to wei
      // Following WithdrawTxButton: parseUnits(formShareAmount, decimals) but we have assets
      const assetsWei = parseUnits(amountNum.toFixed(tokenDecimals), tokenDecimals)
      
      // Convert assets to shares using exchange rate
      // Following WithdrawTxButton pattern: getSharesFromAssets(assets, exchangeRate, decimals)
      const sharesWei = getSharesFromAssets(assetsWei, vaultExchangeRate, tokenDecimals)
      
      // Validate shares don't exceed available share balance
      if (!vaultShareBalance || sharesWei > vaultShareBalance.amount) {
        setError('Insufficient share balance')
        setIsProcessing(false)
        return
      }
      
      // Calculate expected asset amount (minAssets) for slippage protection
      // Following WithdrawTxButton: getAssetsFromShares(withdrawAmount, vaultExchangeRate, decimals)
      const expectedAssetAmount = getAssetsFromShares(sharesWei, vaultExchangeRate, tokenDecimals)
      
      const sharesWeiString = sharesWei.toString()
      const minAssetsWeiString = expectedAssetAmount.toString()

      // Execute redeem transaction via Lemon SDK
      // Following useSend5792RedeemTransaction pattern: redeem(uint256 _shares, address _receiver, address _owner, uint256 _minAssets)
      const result = await callSmartContract({
        contracts: [
          {
            contractAddress: vault.address.toLowerCase() as `0x${string}`,
            functionName: 'redeem',
            functionParams: [
              sharesWeiString,
              wallet.toLowerCase() as `0x${string}`,
              wallet.toLowerCase() as `0x${string}`,
              minAssetsWeiString
            ],
            value: '0',
            chainId: 8453
          }
        ],
      })

      if (result.result === TransactionResult.SUCCESS) {
        // Wait a bit for blockchain to update (following WithdrawTxButton: 7000ms timeout)
        setTimeout(() => {
          refetchBalance()
          refetchVaultBalance()
        }, 2000)
        setCustomAmount('')
      } else if (result.result === TransactionResult.FAILED) {
        setError(result.error.message || 'Redeem failed')
      } else if (result.result === TransactionResult.CANCELLED) {
        setError('Redeem cancelled by user')
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

  // Loading state: wait for both share balance and exchange rate (following WithdrawTxButton pattern)
  const isLoading = !isFetchedVaultBalance || !isFetchedExchangeRate

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


