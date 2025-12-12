import { NETWORK } from '@shared/utilities'
import { Address } from 'viem'

/**
 * Vault configuration
 * This vault is the single vault we're showcasing
 */
export const VAULT_CONFIG = {
  chainId: NETWORK.base,
  vaultAddress: '0x7f5C2b379b88499aC2B997Db583f8079503f25b9' as Address
} as const

/**
 * Tier mapping for prize tiers (0-9)
 * Each tier has an emoji and a display name
 */
export const TIER_MAPPING = [
  { emoji: '💎', name: 'Jackpot' },       // Tier 0
  { emoji: '🏆', name: 'Gran Premio' },   // Tier 1
  { emoji: '🎁', name: 'Mediano' },       // Tier 2
  { emoji: '⚡', name: 'Rápido' },        // Tier 3
  { emoji: '✨', name: 'Flash' },         // Tier 4
  { emoji: '🌟', name: 'Estrella' },      // Tier 5
  { emoji: '🔥', name: 'Fuego' },         // Tier 6
  { emoji: '🎯', name: 'Diana' },         // Tier 7
  { emoji: '💫', name: 'Cometa' },        // Tier 8
  { emoji: '🎪', name: 'Circo' }          // Tier 9
] as const

/**
 * Fallback tier info for unmapped tiers
 */
export const TIER_FALLBACK = {
  emoji: '🎲',
  name: 'Tier'
} as const

