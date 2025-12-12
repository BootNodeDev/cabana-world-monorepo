import { useVaultBalance } from '@generationsoftware/hyperstructure-react-hooks'
import { TokenWithAmount } from '@shared/types'
import { usePoolTogetherContext } from '../providers/PoolTogetherProvider'

/**
 * Returns the total value locked (TVL) for the vault
 * This hook fetches the vault's total deposited balance
 * Refetches every 30 seconds
 */
export const useTVL = (): {
  data: TokenWithAmount | undefined
  isFetched: boolean
} => {
  const { vault } = usePoolTogetherContext()
  
  const { data: balance, isFetched } = useVaultBalance(vault!, 30_000)
  
  return {
    data: balance,
    isFetched: isFetched && !!vault
  }
}

