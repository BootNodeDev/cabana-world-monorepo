import { useLemonContext } from '../providers/LemonProvider'

/**
 * Displays Lemon wallet connection button
 * Shown when wallet is not connected
 */
export const LemonConnect = () => {
  const { authenticate } = useLemonContext()

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Lemon Wallet</h3>
      <p className="text-gray-500 mb-4">Not connected</p>
      <button
        onClick={authenticate}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Connect Wallet
      </button>
    </div>
  )
}

