/**
 * Reusable "dumb" component for funds input with Max button and action button
 * Used by deposit and withdraw components for both Lemon and PoolTogether
 */
interface FundsInputProps {
  value: string
  onChange: (value: string) => void
  onMaxClick?: () => void
  onActionClick: () => void
  availableBalance: number
  isProcessing: boolean
  isLoading: boolean
  error?: string | null
  actionLabel: string
  actionButtonClassName: string
  placeholder: string
  inputMax?: number
  disabled?: boolean
  processingLabel?: string
}

export const FundsInput = ({
  value,
  onChange,
  onMaxClick,
  onActionClick,
  availableBalance,
  isProcessing,
  isLoading,
  error,
  actionLabel,
  actionButtonClassName,
  placeholder,
  inputMax,
  disabled = false,
  processingLabel = 'Processing...'
}: FundsInputProps) => {
  const isDisabled =
    disabled ||
    isProcessing ||
    isLoading ||
    !value ||
    parseFloat(value) <= 0 ||
    (inputMax !== undefined && parseFloat(value) > inputMax)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="number"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              min="0"
              step="0.01"
              max={inputMax}
              disabled={isProcessing || isLoading || disabled}
              className="w-full px-3 py-2 border rounded disabled:bg-gray-100 pr-16 text-black"
            />
            {onMaxClick && availableBalance > 0 && (
              <button
                onClick={onMaxClick}
                disabled={isProcessing || isLoading || disabled}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Max
              </button>
            )}
          </div>
          <button
            onClick={onActionClick}
            disabled={isDisabled}
            className={`px-4 py-2 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed ${actionButtonClassName}`}
          >
            {isProcessing ? processingLabel : actionLabel}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="text-center text-gray-500">
          Refreshing balance...
        </div>
      )}
    </div>
  )
}

