import { authenticate, isWebView, TransactionResult } from '@lemoncash/mini-app-sdk'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Address } from 'viem'

/**
 * Context value containing Lemon wallet connection state
 */
interface ContextValue {
  wallet: Address | undefined
  isConnected: boolean
  isConnecting: boolean
  isWebView: boolean
  authenticate: () => Promise<void>
  disconnect: () => void
}

const Context = createContext<ContextValue | undefined>(undefined)

/**
 * LemonProvider component that manages Lemon mini-app SDK connection
 * Handles authentication and provides wallet address to children
 */
export const LemonProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<Address | undefined>(undefined)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [isInWebView, setIsInWebView] = useState<boolean>(false)

  // Authenticate user with Lemon SDK
  const handleAuthenticate = useCallback(async () => {
    if (!isInWebView) {
      console.warn('Not running in Lemon Cash WebView environment')
      return
    }

    setIsConnecting(true)
    try {
      const result = await authenticate()

      if (result.result === TransactionResult.SUCCESS) {
        setWallet(result.data.wallet as Address)
        setIsConnected(true)
      } else if (result.result === TransactionResult.FAILED) {
        console.error('Authentication failed:', result.error.message)
      } else if (result.result === TransactionResult.CANCELLED) {
        console.log('Authentication cancelled by user')
      }
    } catch (error) {
      console.error('Error during authentication:', error)
    } finally {
      setIsConnecting(false)
    }
  }, [isInWebView])

  // Check if running in WebView environment
  useEffect(() => {
    const checkWebView = () => {
      setIsInWebView(isWebView())
    }
    checkWebView()
  }, [])

  // Auto-authenticate when WebView is detected
  useEffect(() => {
    if (isInWebView && !isConnected) {
      handleAuthenticate()
    }
  }, [isInWebView, isConnected, handleAuthenticate])



  // Disconnect wallet
  const handleDisconnect = useCallback(() => {
    setWallet(undefined)
    setIsConnected(false)
  }, [])

  const value = useMemo(
    () => ({
      wallet,
      isConnected,
      isConnecting,
      isWebView: isInWebView,
      authenticate: handleAuthenticate,
      disconnect: handleDisconnect
    }),
    [wallet, isConnected, isConnecting, isInWebView, handleAuthenticate, handleDisconnect]
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

/**
 * Hook to consume the Lemon Context
 * Throws an error if used outside of LemonProvider
 */
export const useLemonContext = (): ContextValue => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useLemonContext must be used within a LemonProvider')
  }
  return context
}

