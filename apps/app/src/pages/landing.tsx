import { NextDrawTime, PrizeTiers, TotalDeposited } from 'src/landing/components'
import { PoolTogetherProvider } from 'src/landing/providers'

/**
 * Landing Page - Mini App
 * 
 * This is a minimal landing page showcasing a single vault's data:
 * - Total deposited (TVL)
 * - Next draw time
 * - Prize tiers (amounts and winner counts)
 * 
 * All logic is isolated in src/landing/ folder for easy extraction
 * 
 * PoolTogetherProvider initializes PrizePool and Vault instances once
 * and shares them across all components via React Context
 */
export default function LandingPage() {
  return (
    <PoolTogetherProvider>
      <main>

        <TotalDeposited />
        <br />

        <NextDrawTime />
        <br />

        <PrizeTiers />
      </main>
    </PoolTogetherProvider>
  )
}

