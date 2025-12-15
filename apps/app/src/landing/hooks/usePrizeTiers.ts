import { useAllPrizeInfo, usePrizeTokenData } from '@generationsoftware/hyperstructure-react-hooks'
import { useCoingeckoTokenPrices } from '@shared/generic-react-hooks'
import { PrizeInfo } from '@shared/types'
import { lower } from '@shared/utilities'
import { useMemo } from 'react'
import { formatUnits } from 'viem'
import { usePoolTogetherContext } from '../providers/PoolTogetherProvider'

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
 * Uses CoinGecko for token prices instead of Cabana API to avoid CORS issues
 * Prices are in USD
 */
export const usePrizeTiers = () => {
  const { prizePool } = usePoolTogetherContext()

  // Fetch prize info for all tiers using hyperstructure hook
  const { data: allPrizeInfo, isFetched: isFetchedPrizeInfo } = useAllPrizeInfo(
    prizePool ? [prizePool] : []
  )

  // Fetch prize token data (symbol, decimals, etc.)
  const { data: prizeToken, isFetched: isFetchedPrizeToken } = usePrizeTokenData(prizePool!)

  // Fetch prize token price using CoinGecko (in USD)
  const { data: coingeckoPrices, isFetched: isFetchedCoingeckoPrices } = useCoingeckoTokenPrices(
    prizePool?.chainId || 0,
    prizeToken?.address ? [prizeToken.address] : [],
    ['usd']
  )

  // Get prize token price in USD
  const prizeTokenPriceUSD = useMemo(() => {
    if (!prizeToken || !coingeckoPrices) return undefined

    const prizeTokenAddressLower = lower(prizeToken.address)
    return coingeckoPrices[prizeTokenAddressLower]?.usd
  }, [prizeToken, coingeckoPrices])

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

      // Calculate value in USD if price is available
      const prizeAmountUSD =
        prizeTokenPriceUSD !== undefined
          ? parseFloat(prizeAmountToken) * prizeTokenPriceUSD
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
  }, [prizeInfo, prizeToken, prizeTokenPriceUSD])

  return {
    data: tierData,
    isFetched: isFetchedPrizeInfo && isFetchedPrizeToken && isFetchedCoingeckoPrices && !!prizePool
  }
}
