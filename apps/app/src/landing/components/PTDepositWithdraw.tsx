import { useState } from 'react'
import { useLemonContext } from '../providers/LemonProvider'
import { usePoolTogetherContext } from '../providers/PoolTogetherProvider'
import { PTDeposit } from './PTDeposit'
import { PTWithdraw } from './PTWithdraw'

type Mode = 'deposit' | 'withdraw'

/**
 * Unified component for deposit and withdraw with toggle
 * Allows moving USDC between Lemon account and PoolTogether vault
 * Uses Lemon's callSmartContract to execute transactions
 */
export const PTDepositWithdraw = () => {
  const { isConnected } = useLemonContext()
  const { vault, tokenAddress, tokenDecimals } = usePoolTogetherContext()
  const [mode, setMode] = useState<Mode>('deposit')

  // Reset when switching modes
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
  }

  if (!isConnected || !vault || !tokenAddress || !tokenDecimals) {
    return null
  }

  const isDepositMode = mode === 'deposit'

  return (
    <div>
      {/* Toggle between deposit and withdraw */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {isDepositMode ? 'Invertir USDC' : 'Rescatar USDC'}
        </h3>
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleModeChange('deposit')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${isDepositMode
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Invertir
          </button>
          <button
            onClick={() => handleModeChange('withdraw')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${!isDepositMode
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Rescatar
          </button>
        </div>
      </div>

      {isDepositMode ? <PTDeposit /> : <PTWithdraw />}
    </div>
  )
}

