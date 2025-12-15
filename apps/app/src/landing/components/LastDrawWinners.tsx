import { TokenValue } from '@shared/react-components'
import { usePrizeTiers, useLastDrawWinnersByTier } from '../hooks'
import { TIER_MAPPING, TIER_FALLBACK } from '../constants'

/**
 * Displays last draw winners grouped by tier
 * Shows: tier name, winner count, and prize amount (or "vacante" if no winner)
 */
export const LastDrawWinners = () => {
  const { data: tiers, isFetched: isFetchedTiers } = usePrizeTiers()
  const { data: lastDrawWinners, isFetched: isFetchedWinners } = useLastDrawWinnersByTier()

  const isFetched = isFetchedTiers && isFetchedWinners

  if (!isFetched) {
    return <div>Cargando ganadores...</div>
  }

  if (!tiers || tiers.length === 0) {
    return null
  }

  if (!lastDrawWinners) {
    return <div>No hay sorteos disponibles</div>
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">
        Último sorteo {lastDrawWinners.drawId ? `#${lastDrawWinners.drawId}` : ''}:
      </h2>
      <div className="flex flex-col gap-3">
        {tiers.map((tier) => {
          const tierConfig = TIER_MAPPING[tier.tier] || TIER_FALLBACK
          const tierWinners = lastDrawWinners.winnersByTier[tier.tier] || []
          const winnerCount = tierWinners.length

          // Calculate total payout for this tier (sum of all winners' payouts)
          const totalPayout = tierWinners.reduce((sum, winner) => sum + winner.payout, 0n)

          // Use the prize token data (from prize pool) for displaying amounts
          const totalPayoutTokenData = {
            chainId: tier.chainId,
            address: tier.tokenAddress as `0x${string}`,
            amount: totalPayout,
            decimals: tier.tokenDecimals,
            symbol: tier.tokenSymbol
          }

          return (
            <div key={tier.tier} className="flex flex-row items-center gap-4">
              <div className="min-w-[120px]">
                {tierConfig.emoji} {tierConfig.name}
              </div>
              <div className="flex-1">
                {winnerCount > 0 ? (
                  <>
                    <TokenValue
                      token={totalPayoutTokenData}
                    />{' '}
                    entre {winnerCount === 1 ? '1 ganador' : `${winnerCount} ganadores`}
                  </>
                ) : (
                  <span className="text-gray-400 italic">vacante</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
