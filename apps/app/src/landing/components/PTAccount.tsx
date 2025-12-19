import { useLemonContext } from '../providers/LemonProvider'
import { usePoolTogetherContext } from '../providers/PoolTogetherProvider'
import { PTAccountInfo } from './PTAccountInfo'
import { PTDepositWithdraw } from './PTDepositWithdraw'

/**
 * Unified component that combines account info and deposit/withdraw functionality
 * Provides a cohesive visual design for the PoolTogether account section
 */
export const PTAccount = () => {
  const { isConnected } = useLemonContext()
  const { vault } = usePoolTogetherContext()

  if (!isConnected || !vault) {
    return null
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <PTAccountInfo />
      <PTDepositWithdraw />
    </div>
  )
}
