import { useTokenBalance } from '@generationsoftware/hyperstructure-react-hooks'
import { TokenWithAmount } from '@shared/types'
import { NETWORK } from '@shared/utilities'
import { Address } from 'viem'
import { useLemonContext } from '../providers/LemonProvider'

/**
 * USDC token address on Base chain
 */
const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54b90Dc9eA' as Address

/**
 * Returns the USDC balance for the Lemon wallet
 * Refetches every 10 seconds
 */
export const useLemonUsdcBalance = (): {
  data: TokenWithAmount | undefined
  isFetched: boolean
  refetch: () => void
} => {
  const { wallet, isConnected } = useLemonContext()

  const { data, isFetched, refetch } = useTokenBalance(
    NETWORK.base,
    wallet?.toLowerCase() as Address,
    USDC_BASE_ADDRESS.toLowerCase() as Address
  )

  return {
    data: wallet && isConnected ? data : undefined,
    isFetched: isFetched && !!wallet && isConnected,
    refetch: refetch || (() => {})
  }
}
