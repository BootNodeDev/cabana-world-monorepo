import { PrizePool, Vault } from '@generationsoftware/hyperstructure-client-js'
import { usePublicClientsByChain, useVaultTokenData } from '@generationsoftware/hyperstructure-react-hooks'
import { PRIZE_POOLS } from '@shared/utilities'
import { Address } from 'viem'
import { createContext, ReactNode, useContext, useMemo } from 'react'
import { VAULT_CONFIG } from '../constants'

/**
 * Context value containing PrizePool and Vault instances, plus token information
 */
interface ContextValue {
  prizePool: PrizePool | undefined
  vault: Vault | undefined
  tokenAddress: Address | undefined
  tokenDecimals: number | undefined
}

const Context = createContext<ContextValue | undefined>(undefined)

/**
 * PoolTogetherProvider component that initializes PrizePool and Vault instances once
 * and shares them across all components
 */
export const PoolTogetherProvider = ({ children }: { children: ReactNode }) => {
  const publicClients = usePublicClientsByChain()

  // Initialize PrizePool instance once
  const prizePool = useMemo(() => {
    const client = publicClients[VAULT_CONFIG.chainId]
    if (!client) return undefined

    // Find the prize pool configuration for our chain
    const prizePoolInfo = PRIZE_POOLS.find(
      (pool) => pool.chainId === VAULT_CONFIG.chainId
    )

    if (!prizePoolInfo) return undefined

    return new PrizePool(
      prizePoolInfo.chainId,
      prizePoolInfo.address,
      client,
      prizePoolInfo.options
    )
  }, [publicClients])

  // Initialize Vault instance once
  const vault = useMemo(() => {
    const client = publicClients[VAULT_CONFIG.chainId]
    if (!client) return undefined

    return new Vault(
      VAULT_CONFIG.chainId,
      VAULT_CONFIG.vaultAddress,
      client
    )
  }, [publicClients])

  // Get token data from vault (hook handles undefined with enabled flag)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { data: tokenData } = useVaultTokenData(vault!)

  const value = useMemo(
    () => ({
      prizePool,
      vault,
      tokenAddress: tokenData?.address,
      tokenDecimals: tokenData?.decimals
    }),
    [prizePool, vault, tokenData?.address, tokenData?.decimals]
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

/**
 * Hook to consume the Context
 * Throws an error if used outside of PoolTogetherProvider
 */
export const usePoolTogetherContext = (): ContextValue => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('usePoolTogetherContext must be used within a PoolTogetherProvider')
  }
  return context
}

