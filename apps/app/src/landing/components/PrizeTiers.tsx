import { TokenAmount, CurrencyValue } from '@shared/react-components'
import { usePrizeTiers } from '../hooks'
import { TIER_MAPPING, TIER_FALLBACK } from '../constants'

/**
 * Displays prize tiers
 * Shows: emoji, name, prize amount, and winner count for each tier
 */
export const PrizeTiers = () => {
  const { data: tiers, isFetched } = usePrizeTiers()

  if (!isFetched) {
    return <div>Cargando premios...</div>
  }

  if (!tiers || tiers.length === 0) {
    return <div>No hay premios disponibles</div>
  }

  return (
    <div>
      <h2>Premios</h2>
      {tiers.map((tier) => {
        const tierConfig = TIER_MAPPING[tier.tier] || TIER_FALLBACK
        const prizeToken = {
          chainId: tier.chainId,
          address: tier.tokenAddress as `0x${string}`,
          amount: tier.prizeAmountRaw,
          decimals: tier.tokenDecimals,
          symbol: tier.tokenSymbol
        }

        const winnersText =
          tier.prizeCount === 1 ? '1 ganador' : `hasta ${tier.prizeCount} ganadores`

        return (
          <div key={tier.tier} className="flex flex-row items-center gap-4">
            <div>
              {tierConfig.emoji} {tierConfig.name}
            </div>
            <div>
              {tier.prizeAmountUSD !== undefined ? (
                <CurrencyValue
                  baseValue={tier.prizeAmountUSD}
                  baseCurrency="usd"
                  fallback={
                    <TokenAmount
                      token={prizeToken}
                      maximumFractionDigits={4}
                    />
                  }
                />
              ) : (
                <TokenAmount
                  token={prizeToken}
                  maximumFractionDigits={4}
                />
              )}
            </div>
            <div>{winnersText}</div>
          </div>
        )
      })}
    </div>
  )
}

