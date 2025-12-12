import { PrizePool, Vault } from '@generationsoftware/hyperstructure-client-js'
import { usePublicClientsByChain } from '@generationsoftware/hyperstructure-react-hooks'
import { PRIZE_POOLS } from '@shared/utilities'
import { createContext, ReactNode, useContext, useMemo } from 'react'
import { VAULT_CONFIG } from '../constants'

/**
 * Context value containing PrizePool and Vault instances
 */
interface ContextValue {
  prizePool: PrizePool | undefined
  vault: Vault | undefined
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

  const value = useMemo(
    () => ({
      prizePool,
      vault
    }),
    [prizePool, vault]
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

