import { useLemonContext } from '../providers/LemonProvider'
import { LemonDeposit } from './LemonDeposit'
import { LemonWallet } from './LemonWallet'

/**
 * Unified component that combines wallet info and deposit/withdraw functionality
 * Provides a cohesive visual design for the Lemon account section
 */
export const LemonAccount = () => {
  const { isConnected } = useLemonContext()

  if (!isConnected) {
    return null
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <LemonWallet />
      <LemonDeposit />
    </div>
  )
}

