import { useUserVaultTokenBalance, useUserVaultShareBalance, usePrizeOdds } from '@generationsoftware/hyperstructure-react-hooks'
import { formatUnits } from 'viem'
import { Address } from 'viem'
import { useLemonContext } from '../providers/LemonProvider'
import { usePoolTogetherContext } from '../providers/PoolTogetherProvider'
import { PTDepositWithdraw } from './PTDepositWithdraw'

/**
 * Component that displays total deposited in PoolTogether and winning chances
 */
const PTAccountInfo = () => {
  const { wallet, isConnected } = useLemonContext()
  const { vault, prizePool } = usePoolTogetherContext()

  // Get user's token balance (total deposited)
  const { data: tokenBalance, isFetched: isFetchedTokenBalance } = useUserVaultTokenBalance(
    vault!,
    wallet as Address
  )

  // Get user's share balance for odds calculation
  const { data: shareBalance, isFetched: isFetchedShareBalance } = useUserVaultShareBalance(
    vault!,
    wallet as Address
  )

  // Calculate winning odds
  const { data: prizeOdds, isFetched: isFetchedPrizeOdds } = usePrizeOdds(
    prizePool!,
    vault!,
    shareBalance?.amount ?? 0n
  )

  if (!isConnected || !wallet || !vault || !prizePool) {
    return null
  }

  // Format balance for display
  const formatBalance = (balance: bigint, decimals: number) => {
    const amount = parseFloat(formatUnits(balance, decimals))
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount)
  }

  // Format odds for display
  const formatOdds = () => {
    if (!prizeOdds || prizeOdds.percent === 0) {
      return 'N/A'
    }
    
    if (prizeOdds.oneInX < 1000) {
      return `1 in ${Math.round(prizeOdds.oneInX)}`
    } else if (prizeOdds.oneInX < 1000000) {
      return `1 in ${(prizeOdds.oneInX / 1000).toFixed(1)}K`
    } else {
      return `1 in ${(prizeOdds.oneInX / 1000000).toFixed(1)}M`
    }
  }

  const isLoading = !isFetchedTokenBalance || !isFetchedShareBalance || !isFetchedPrizeOdds
  const hasDeposit = tokenBalance && tokenBalance.amount > 0n

  return (
    <div className="space-y-2">
      <div>
        <span className="text-sm text-gray-500">Total Depositado: </span>
        <span className="font-semibold">
          {isLoading ? (
            'Loading...'
          ) : hasDeposit ? (
            `${formatBalance(tokenBalance.amount, tokenBalance.decimals)} ${tokenBalance.symbol || 'USDC'}`
          ) : (
            '0.00 USDC'
          )}
        </span>
      </div>

      <div>
        <span className="text-sm text-gray-500">Chances de Ganar: </span>
        <span className="font-semibold">
          {isLoading ? (
            'Loading...'
          ) : hasDeposit && prizeOdds ? (
            formatOdds()
          ) : (
            'N/A'
          )}
        </span>
      </div>
    </div>
  )
}

/**
 * Unified component that combines account info and deposit/withdraw functionality
 * Provides a cohesive visual design for the PoolTogether account section
 */
export const PTAccount = () => {
  const { isConnected } = useLemonContext()
  const { vault } = usePoolTogetherContext()

  if (!isConnected || !vault) {
    return null
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <PTAccountInfo />
      <PTDepositWithdraw />
    </div>
  )
}

