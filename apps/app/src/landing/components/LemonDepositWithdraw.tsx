import { useState } from 'react'
import { useLemonContext } from '../providers/LemonProvider'
import { LemonDeposit } from './LemonDeposit'
import { LemonWithdraw } from './LemonWithdraw'

type Mode = 'deposit' | 'withdraw'

/**
 * Unified component for deposit and withdraw with toggle
 * Allows moving USDC between Lemon account and mini-app wallet
 */
export const LemonDepositWithdraw = () => {
  const { isConnected } = useLemonContext()
  const [mode, setMode] = useState<Mode>('deposit')

  // Reset when switching modes
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
  }

  if (!isConnected) {
    return null
  }

  const isDepositMode = mode === 'deposit'

  return (
    <div>
      {/* Toggle between deposit and withdraw */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {isDepositMode ? 'Deposit USDC' : 'Withdraw USDC'}
        </h3>
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleModeChange('deposit')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${isDepositMode
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Deposit
          </button>
          <button
            onClick={() => handleModeChange('withdraw')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${!isDepositMode
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Withdraw
          </button>
        </div>
      </div>

      {isDepositMode ? <LemonDeposit /> : <LemonWithdraw />}
    </div>
  )
}
