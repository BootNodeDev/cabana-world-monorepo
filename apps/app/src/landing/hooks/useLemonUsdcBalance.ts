import { useTokenBalance } from '@generationsoftware/hyperstructure-react-hooks'
import { TokenWithAmount } from '@shared/types'
import { NETWORK } from '@shared/utilities'
import { Address } from 'viem'
import { useLemonContext } from '../providers/LemonProvider'
import { usePoolTogetherContext } from '../providers/PoolTogetherProvider'

type TokenBalanceResult = ReturnType<typeof useTokenBalance>

/**
 * Returns the token balance for the Lemon wallet
 * Uses token address from PoolTogetherProvider
 * Refetches every 10 seconds
 */
export const useLemonUsdcBalance = (): {
  data: TokenWithAmount | undefined
  isFetched: boolean
  isRefetching: boolean
  refetch: TokenBalanceResult['refetch']
} => {
  const { wallet, isConnected } = useLemonContext()
  const { tokenAddress } = usePoolTogetherContext()

  const tokenBalanceResult = useTokenBalance(
    NETWORK.base,
    wallet?.toLowerCase() as Address,
    tokenAddress?.toLowerCase() as Address
  )

  return {
    data: wallet && isConnected && tokenAddress ? tokenBalanceResult.data : undefined,
    isFetched: tokenBalanceResult.isFetched && !!wallet && isConnected && !!tokenAddress,
    isRefetching: tokenBalanceResult.isFetching ?? false,
    refetch: tokenBalanceResult.refetch
  }
}
