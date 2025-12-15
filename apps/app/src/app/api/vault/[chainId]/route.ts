import { NextRequest, NextResponse } from 'next/server'

export interface VaultChainIdApiParams {
  chainId: string
}

export function GET(_req: NextRequest, ctx: { params: VaultChainIdApiParams }): NextResponse {
  return NextResponse.json(
    { message: `Missing <vaultAddress> in /api/vault/${ctx.params.chainId}/<vaultAddress>` },
    { status: 400 }
  )
}
