import {
  useAllPrizeInfo,
  usePrizeTokenData,
  useVaultTokenData
} from '@generationsoftware/hyperstructure-react-hooks'
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
 * Prices are calculated relative to the vault token
 */
export const usePrizeTiers = () => {
  const { prizePool, vault } = usePoolTogetherContext()

  // Fetch prize info for all tiers using hyperstructure hook
  const { data: allPrizeInfo, isFetched: isFetchedPrizeInfo } = useAllPrizeInfo(
    prizePool ? [prizePool] : []
  )

  // Fetch prize token data (symbol, decimals, etc.)
  const { data: prizeToken, isFetched: isFetchedPrizeToken } = usePrizeTokenData(prizePool!)

  // Fetch vault token data
  const { data: vaultToken, isFetched: isFetchedVaultToken } = useVaultTokenData(vault!)

  // Fetch both token prices using CoinGecko (in USD)
  const tokenAddresses = useMemo(() => {
    const addresses: string[] = []
    if (prizeToken?.address) addresses.push(prizeToken.address)
    if (vaultToken?.address) addresses.push(vaultToken.address)
    return addresses
  }, [prizeToken?.address, vaultToken?.address])

  const { data: coingeckoPrices, isFetched: isFetchedCoingeckoPrices } = useCoingeckoTokenPrices(
    prizePool?.chainId || 0,
    tokenAddresses,
    ['usd']
  )

  // Calculate prize token price relative to vault token
  const prizeTokenPrice = useMemo(() => {
    if (!prizeToken || !vaultToken || !coingeckoPrices) return undefined

    const prizeTokenAddressLower = lower(prizeToken.address)
    const vaultTokenAddressLower = lower(vaultToken.address)

    const prizeTokenPriceUSD = coingeckoPrices[prizeTokenAddressLower]?.usd
    const vaultTokenPriceUSD = coingeckoPrices[vaultTokenAddressLower]?.usd

    // If we have both prices in USD, calculate relative price
    if (
      prizeTokenPriceUSD !== undefined &&
      vaultTokenPriceUSD !== undefined &&
      vaultTokenPriceUSD > 0
    ) {
      return prizeTokenPriceUSD / vaultTokenPriceUSD
    }

    return undefined
  }, [prizeToken, vaultToken, coingeckoPrices])

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

      // Calculate value in vault token units if price is available
      const prizeAmountUSD =
        prizeTokenPrice !== undefined ? parseFloat(prizeAmountToken) * prizeTokenPrice : undefined

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
    isFetched:
      isFetchedPrizeInfo &&
      isFetchedPrizeToken &&
      isFetchedVaultToken &&
      isFetchedCoingeckoPrices &&
      !!prizePool &&
      !!vault
  }
}
