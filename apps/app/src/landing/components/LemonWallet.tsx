import { formatUnits } from 'viem'
import { useLemonContext } from '../providers/LemonProvider'
import { useLemonUsdcBalance } from '../hooks'

/**
 * Displays Lemon wallet address and USDC balance
 * Only shown when wallet is connected
 */
export const LemonWallet = () => {
  const { wallet, disconnect } = useLemonContext()
  const { data: usdcBalance, isFetched } = useLemonUsdcBalance()

  // Format wallet address for display (first 6 + last 4 characters)
  const formatAddress = (address: string) => {
    //return `${address.slice(0, 6)}...${address.slice(-4)}`
    return address
  }

  // Format USDC balance
  const formatBalance = () => {
    if (!usdcBalance) return '0.00'
    const amount = parseFloat(formatUnits(usdcBalance.amount, usdcBalance.decimals))
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">Lemon Wallet</h3>
        <button
          onClick={disconnect}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Disconnect
        </button>
      </div>

      {wallet && (
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-500">Address: </span>
            <span className="font-mono text-sm">{formatAddress(wallet)}</span>
          </div>

          <div>
            <span className="text-sm text-gray-500">USDC Balance: </span>
            <span className="font-semibold">
              {isFetched ? `${formatBalance()} ${usdcBalance?.symbol || 'USDC'}` : 'Loading...'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

