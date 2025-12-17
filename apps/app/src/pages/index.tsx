import {
  LastDrawWinners,
  LemonDeposit,
  LemonWallet,
  LemonWebViewError,
  NextDrawTime,
  PrizeTiers,
  TotalDeposited
} from 'src/landing/components'
import { LemonProvider, PoolTogetherProvider, useLemonContext } from 'src/landing/providers'

/**
 * Main content component that checks WebView environment
 */
const LandingContent = () => {
  const { isWebView } = useLemonContext()

  // if (!isWebView) {
  //   return <LemonWebViewError />
  // }

  return (
    <PoolTogetherProvider>
      <main>
        <LemonWallet />
        <br />

        <LemonDeposit />
        <br />

        <TotalDeposited />
        <br />

        <NextDrawTime />
        <br />

        <PrizeTiers />
        <br />

        <LastDrawWinners />
      </main>
    </PoolTogetherProvider>
  )
}

/**
 * Landing Page - Mini App
 * 
 * This is a minimal landing page showcasing a single vault's data:
 * - Lemon wallet connection and USDC balance
 * - Deposit USDC from Lemon account
 * - Total deposited (TVL)
 * - Next draw time
 * - Last draw winners (grouped by tier)
 * - Prize tiers (amounts and winner counts)
 * 
 * All logic is isolated in src/landing/ folder for easy extraction
 * 
 * PoolTogetherProvider initializes PrizePool and Vault instances once
 * and shares them across all components via React Context
 * 
 * LemonProvider manages Lemon mini-app SDK connection and wallet state
 * 
 * Shows error message if not running inside Lemon WebView environment
 */
export default function LandingPage() {
  return (
    <LemonProvider>
      <LandingContent />
    </LemonProvider>
  )
}

