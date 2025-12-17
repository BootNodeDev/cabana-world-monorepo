import { NO_REFETCH } from '@shared/generic-react-hooks'
import { lower, SUBGRAPH_API_URLS } from '@shared/utilities'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Address, formatUnits } from 'viem'
import { usePoolTogetherContext } from '../providers/PoolTogetherProvider'
import { usePrizeTokenPriceUSD } from './usePrizeTokenPriceUSD'

/**
 * Represents a winner for a specific tier
 */
export interface TierWinner {
  winner: Address
  payout: bigint
  payoutUSD: number | undefined
}

/**
 * Raw prize claim data from the subgraph API
 */
interface SubgraphPrizeClaim {
  id: string
  winner: string
  tier: number
  payout: string
  timestamp: string
}

/**
 * Represents a prize claim from the subgraph (transformed)
 */
interface PrizeClaim {
  id: string
  winner: Address
  tier: number
  payout: bigint
}

/**
 * Returns the last draw's winners grouped by tier for a specific vault
 * Each tier can have multiple winners (one per prize in that tier)
 */
export const useLastDrawWinnersByTier = () => {
  const { prizePool, vault } = usePoolTogetherContext()
  const { prizeToken, prizeTokenPriceUSD, isFetched: isFetchedPrice } = usePrizeTokenPriceUSD()

  // Fetch last draw with all prize claims for the specific vault
  const { data: lastDraw, isFetched } = useQuery({
    queryKey: ['lastDrawWinnersByTier', prizePool?.chainId, vault?.address],
    queryFn: async () => {
      if (!prizePool || !vault) return null

      const subgraphUrl = SUBGRAPH_API_URLS[prizePool.chainId as keyof typeof SUBGRAPH_API_URLS]

      if (!subgraphUrl) {
        console.warn(`Could not find subgraph URL for chain ID: ${prizePool.chainId}`)
        return null
      }

      const headers = { 'Content-Type': 'application/json' }
      const vaultAddressLower = lower(vault.address)

      // First, get the last draw ID
      const lastDrawQuery = JSON.stringify({
        query: `query {
          draws(first: 1, orderBy: drawId, orderDirection: desc) {
            drawId
          }
        }`
      })

      const lastDrawResult = await fetch(subgraphUrl, {
        method: 'POST',
        headers,
        body: lastDrawQuery
      })
      const lastDrawData = (await lastDrawResult.json()) as {
        data?: {
          draws?: Array<{
            drawId: number
          }>
        }
      }
      const lastDrawId = lastDrawData?.data?.draws?.[0]?.drawId

      if (!lastDrawId) {
        return null
      }

      // Then, get all prize claims for that draw and vault
      const prizeClaimsQuery = JSON.stringify({
        query: `query($drawId: Int, $vaultAddress: Bytes) {
          prizeClaims(
            where: { 
              draw_: { drawId: $drawId }
              prizeVault_: { address: $vaultAddress }
              payout_gt: 0
            }
            orderBy: tier
            orderDirection: asc
          ) {
            id
            winner
            tier
            payout
            timestamp
          }
        }`,
        variables: {
          drawId: lastDrawId,
          vaultAddress: vaultAddressLower
        }
      })

      const prizeClaimsResult = await fetch(subgraphUrl, {
        method: 'POST',
        headers,
        body: prizeClaimsQuery
      })
      const prizeClaimsData = (await prizeClaimsResult.json()) as {
        data?: {
          prizeClaims?: SubgraphPrizeClaim[]
        }
      }
      const prizeClaims: SubgraphPrizeClaim[] = prizeClaimsData?.data?.prizeClaims || []

      return {
        drawId: lastDrawId,
        prizeClaims: prizeClaims.map(
          (claim: SubgraphPrizeClaim): PrizeClaim => ({
            id: claim.id,
            winner: claim.winner as Address,
            tier: claim.tier,
            payout: BigInt(claim.payout)
          })
        )
      }
    },
    enabled: !!prizePool && !!vault,
    ...NO_REFETCH
  })

  // Group winners by tier
  const winnersByTier = useMemo(() => {
    if (!lastDraw || !lastDraw.prizeClaims || lastDraw.prizeClaims.length === 0) {
      return undefined
    }

    const grouped: { [tier: number]: TierWinner[] } = {}

    lastDraw.prizeClaims.forEach((claim: PrizeClaim) => {
      if (claim.payout > 0n) {
        // Calculate USD value if price is available
        const payoutToken = formatUnits(claim.payout, prizeToken?.decimals || 18)
        const payoutUSD =
          prizeTokenPriceUSD !== undefined ? parseFloat(payoutToken) * prizeTokenPriceUSD : undefined

        if (!grouped[claim.tier]) {
          grouped[claim.tier] = []
        }
        grouped[claim.tier].push({
          winner: claim.winner,
          payout: claim.payout,
          payoutUSD
        })
      }
    })

    return {
      drawId: lastDraw.drawId,
      winnersByTier: grouped
    }
  }, [lastDraw])

  return {
    data: winnersByTier,
    isFetched: isFetched && isFetchedPrice
  }
}
