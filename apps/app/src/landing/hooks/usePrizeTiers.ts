import { PrizeInfo } from '@shared/types'
import { useMemo } from 'react'
import { formatUnits } from 'viem'
import { usePoolTogetherContext } from '../providers/PoolTogetherProvider'
import {
  useAllPrizeInfo,
  usePrizeTokenData,
  usePrizeTokenPrice
} from '@generationsoftware/hyperstructure-react-hooks'

/**
 * Represents a single tier with all display data
 */
export interface TierData {
  tier: number
  prizeCount: number
  prizeAmountUSD: number | undefined
  prizeAmountToken: string
  tokenSymbol: string
  tokenAddress: string
  chainId: number
  tokenDecimals: number
  prizeAmountRaw: bigint
}

/**
 * Returns prize tier data
 * Fetches all prize tiers with amounts and winner counts
 */
export const usePrizeTiers = () => {
  const { prizePool } = usePoolTogetherContext()

  // Fetch prize info for all tiers using hyperstructure hook
  const { data: allPrizeInfo, isFetched: isFetchedPrizeInfo } = useAllPrizeInfo(
    prizePool ? [prizePool] : []
  )

  // Fetch prize token data (symbol, decimals, etc.)
  const { data: prizeToken, isFetched: isFetchedPrizeToken } = usePrizeTokenData(prizePool!)

  // Fetch prize token price
  const { data: prizeTokenPrice, isFetched: isFetchedPrizeTokenPrice } =
    usePrizeTokenPrice(prizePool!)

  // Extract prize info for our prize pool
  const prizeInfo = prizePool ? allPrizeInfo?.[prizePool.id] : undefined

  // Transform the data into a more usable format
  const tierData = useMemo(() => {
    if (!prizeInfo || !prizeToken) return undefined

    const tiers: TierData[] = prizeInfo.map((info: PrizeInfo, tier: number) => {
      const prizeCount = 4 ** tier // Number of prizes for this tier
      const prizeAmount = info.amount.current // Use current prize size

      // Format token amount
      const prizeAmountToken = formatUnits(prizeAmount, prizeToken.decimals)

      // Calculate USD value if price is available
      const prizeAmountUSD = prizeTokenPrice?.price
        ? parseFloat(prizeAmountToken) * prizeTokenPrice.price
        : undefined

      return {
        tier,
        prizeCount,
        prizeAmountUSD,
        prizeAmountToken,
        tokenSymbol: prizeToken.symbol || '?',
        tokenAddress: prizeToken.address,
        chainId: prizeToken.chainId,
        tokenDecimals: prizeToken.decimals,
        prizeAmountRaw: prizeAmount
      }
    })

    return tiers
  }, [prizeInfo, prizeToken, prizeTokenPrice])

  return {
    data: tierData,
    isFetched: isFetchedPrizeInfo && isFetchedPrizeToken && isFetchedPrizeTokenPrice && !!prizePool
  }
}

