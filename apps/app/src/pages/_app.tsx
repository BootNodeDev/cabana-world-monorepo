import { IncomingMessage } from 'http'
import type { AppContext, AppInitialProps, AppProps } from 'next/app'
import App from 'next/app'
import { base } from 'viem/chains'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppContainer } from '@components/AppContainer'
import '../styles/globals.css'
import { wagmiConfig } from '../utils'

// Create a QueryClient instance
const queryClient = new QueryClient()

export interface CustomAppProps {
  serverProps: {
    params: { [key: string]: string }
  }
}

export default function MyApp(props: AppProps & CustomAppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <AppContainer {...props} />
      </WagmiProvider>
    </QueryClientProvider>
  )
}

MyApp.getInitialProps = async (appCtx: AppContext): Promise<AppInitialProps & CustomAppProps> => {
  const initialProps = await App.getInitialProps(appCtx)

  const internalReqKey = Symbol.for('NextInternalRequestMeta')
  interface NextIncomingMessage extends IncomingMessage {
    [internalReqKey]: {
      match: { params: { [key: string]: string } }
    }
  }
  const req = appCtx.ctx.req as NextIncomingMessage | undefined
  const { match } = req?.[internalReqKey] ?? {}
  const serverProps = { params: match?.params ?? {} }

  return { ...initialProps, serverProps }
}
