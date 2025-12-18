import { useTokenBalance } from '@generationsoftware/hyperstructure-react-hooks'
import { TokenWithAmount } from '@shared/types'
import { NETWORK } from '@shared/utilities'
import { useCallback, useState } from 'react'
import { Address } from 'viem'
import { useLemonContext } from '../providers/LemonProvider'

/**
 * USDC token address on Base chain
 */
const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address

/**
 * Returns the USDC balance for the Lemon wallet
 * Refetches every 10 seconds
 */
export const useLemonUsdcBalance = (): {
  data: TokenWithAmount | undefined
  isFetched: boolean
  isRefetching: boolean
  refetch: (delay?: number) => Promise<void>
} => {
  const { wallet, isConnected } = useLemonContext()
  const [isRefetching, setIsRefetching] = useState<boolean>(false)

  const {
    data,
    isFetched,
    refetch: originalRefetch
  } = useTokenBalance(
    NETWORK.base,
    wallet?.toLowerCase() as Address,
    USDC_BASE_ADDRESS.toLowerCase() as Address
  )

  // Wrapped refetch with delay support and loading state
  const refetch = useCallback(
    async (delay?: number) => {
      setIsRefetching(true)

      try {
        if (delay && delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }

        if (originalRefetch) {
          await originalRefetch()
        }
      } finally {
        setIsRefetching(false)
      }
    },
    [originalRefetch]
  )

  return {
    data: wallet && isConnected ? data : undefined,
    isFetched: isFetched && !!wallet && isConnected,
    isRefetching,
    refetch
  }
}
