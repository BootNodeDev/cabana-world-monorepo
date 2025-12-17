import { usePrizeTokenData } from '@generationsoftware/hyperstructure-react-hooks'
import { useCoingeckoTokenPrices } from '@shared/generic-react-hooks'
import { lower } from '@shared/utilities'
import { useMemo } from 'react'
import { Address } from 'viem'
import { usePoolTogetherContext } from '../providers/PoolTogetherProvider'

type PrizeTokenMinimal = {
  address: Address
  chainId: number
  decimals: number
  symbol?: string
}

type PrizeTokenPriceUSDResult = {
  prizeToken?: PrizeTokenMinimal
  prizeTokenPriceUSD?: number
  isFetched: boolean
}

/**
 * Returns the prize token price in USD using CoinGecko
 * Reusable hook for getting prize token price without CORS issues
 */
export const usePrizeTokenPriceUSD = (): PrizeTokenPriceUSDResult => {
  const { prizePool } = usePoolTogetherContext()

  // Fetch prize token data (symbol, decimals, etc.)
  const { data: prizeToken, isFetched: isFetchedPrizeToken } = usePrizeTokenData(prizePool!)

  // Fetch prize token price using CoinGecko (in USD)
  const { data: coingeckoPrices, isFetched: isFetchedCoingeckoPrices } = useCoingeckoTokenPrices(
    prizePool?.chainId || 0,
    prizeToken?.address ? [lower(prizeToken.address)] : [],
    ['usd']
  )

  // Get prize token price in USD
  const prizeTokenPriceUSD = useMemo(() => {
    if (!prizeToken || !coingeckoPrices) return undefined

    const prizeTokenAddressLower = lower(prizeToken.address)
    return coingeckoPrices[prizeTokenAddressLower]?.usd
  }, [prizeToken, coingeckoPrices])

  return {
    prizeToken,
    prizeTokenPriceUSD,
    isFetched: isFetchedPrizeToken && isFetchedCoingeckoPrices && !!prizePool
  }
}
