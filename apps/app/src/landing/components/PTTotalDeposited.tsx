import { formatUnits } from 'viem'
import { useTVL } from '../hooks'

/**
 * Displays the total deposited (TVL) for the vault
 * Shows: "Total depositado: $X,XXX,XXX.XX SYMBOL"
 */
export const PTTotalDeposited = () => {
  const { data: balance, isFetched } = useTVL()

  if (!isFetched) {
    return <div>Cargando TVL...</div>
  }

  if (!balance) {
    return <div>Total depositado: No disponible</div>
  }

  // Format the amount with proper decimals
  const amount = parseFloat(formatUnits(balance.amount, balance.decimals))
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)

  return (
    <div>
      Total depositado: ${formattedAmount} {balance.symbol}
    </div>
  )
}

