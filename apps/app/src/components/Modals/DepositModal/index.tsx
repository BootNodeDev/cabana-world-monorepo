import { Vault } from '@generationsoftware/hyperstructure-client-js'
import {
  useSelectedVault,
  useVaultExchangeRate,
  useVaultTokenData
} from '@generationsoftware/hyperstructure-react-hooks'
import { MODAL_KEYS, useIsModalOpen } from '@shared/generic-react-hooks'
import { Modal } from '@shared/ui'
import { LINKS, lower } from '@shared/utilities'
import classNames from 'classnames'
import { useAtom, useSetAtom } from 'jotai'
import { useTranslations } from 'next-intl'
import { ReactNode, useMemo, useState } from 'react'
import { Hash } from 'viem'
import { useSupportedPrizePools } from '@hooks/useSupportedPrizePools'
import {
  depositFormShareAmountAtom,
  depositFormTokenAddressAtom,
  depositFormTokenAmountAtom
} from './DepositForm'
import { DepositTxButton } from './DepositTxButton'
import { DepositZapTxButton } from './DepositZapTxButton'
import { ConfirmingView } from './Views/ConfirmingView'
import { ErrorView } from './Views/ErrorView'
import { MainView } from './Views/MainView'
import { ReviewView } from './Views/ReviewView'
import { SuccessView } from './Views/SuccessView'
import { WaitingView } from './Views/WaitingView'

export type DepositModalView = 'main' | 'review' | 'waiting' | 'confirming' | 'success' | 'error'

export interface DepositModalProps {
  onClose?: () => void
  refetchUserBalances?: () => void
  onSuccessfulApproval?: () => void
  onSuccessfulDeposit?: (chainId: number, txHash: Hash) => void
  onSuccessfulDepositWithZap?: (chainId: number, txHash: Hash) => void
}

export const DepositModal = (props: DepositModalProps) => {
  const {
    onClose,
    refetchUserBalances,
    onSuccessfulApproval,
    onSuccessfulDeposit,
    onSuccessfulDepositWithZap
  } = props

  const { vault } = useSelectedVault()

  const { isModalOpen, setIsModalOpen } = useIsModalOpen(MODAL_KEYS.deposit, { onClose })

  const [view, setView] = useState<DepositModalView>('main')

  const [depositTxHash, setDepositTxHash] = useState<string>()

  const [formTokenAddress, setFormTokenAddress] = useAtom(depositFormTokenAddressAtom)
  const setFormTokenAmount = useSetAtom(depositFormTokenAmountAtom)
  const setFormShareAmount = useSetAtom(depositFormShareAmountAtom)

  const { data: vaultToken } = useVaultTokenData(vault!)

  const { data: vaultExchangeRate } = useVaultExchangeRate(vault!)

  const prizePools = useSupportedPrizePools()

  const prizePool = useMemo(() => {
    if (!!vault) {
      return Object.values(prizePools).find((prizePool) => prizePool.chainId === vault.chainId)
    }
  }, [prizePools, vault])

  const txInFlight = !depositTxHash && view === 'confirming'

  const handleClose = () => {
    if (txInFlight) {
      return
    }
    setIsModalOpen(false)
    setView('main')
    setFormTokenAddress(undefined)
    setFormTokenAmount('')
    setFormShareAmount('')
    setDepositTxHash('')
  }

  if (isModalOpen && !!vault) {
    const modalViews: Record<DepositModalView, ReactNode> = {
      main: <MainView vault={vault} prizePool={prizePool!} />,
      review: <ReviewView vault={vault} prizePool={prizePool!} />,
      waiting: <WaitingView vault={vault} closeModal={handleClose} />,
      confirming: <ConfirmingView vault={vault} txHash={depositTxHash} closeModal={handleClose} />,
      success: <SuccessView vault={vault} txHash={depositTxHash} />,
      error: <ErrorView setModalView={setView} />
    }

    const isZapping =
      !!vaultToken && !!formTokenAddress && lower(vaultToken.address) !== lower(formTokenAddress)

    const modalFooterContent = !!vaultExchangeRate ? (
      <div
        className={classNames('flex flex-col items-center gap-8', {
          hidden: view !== 'main' && view !== 'review'
        })}
      >
        {isZapping ? (
          <DepositZapTxButton
            vault={vault}
            modalView={view}
            setModalView={setView}
            setDepositTxHash={setDepositTxHash}
            refetchUserBalances={refetchUserBalances}
            onSuccessfulApproval={onSuccessfulApproval}
            onSuccessfulDepositWithZap={onSuccessfulDepositWithZap}
          />
        ) : (
          <DepositTxButton
            vault={vault}
            modalView={view}
            setModalView={setView}
            setDepositTxHash={setDepositTxHash}
            refetchUserBalances={refetchUserBalances}
            onSuccessfulApproval={onSuccessfulApproval}
            onSuccessfulDeposit={onSuccessfulDeposit}
          />
        )}
        {view === 'main' && <DepositDisclaimer vault={vault} />}
      </div>
    ) : undefined

    return (
      <Modal
        bodyContent={modalViews[view]}
        footerContent={modalFooterContent}
        onClose={handleClose}
        preventClose={txInFlight}
        label='deposit-flow'
        mobileStyle='tab'
        className='isolate'
        bodyClassName='z-10'
      />
    )
  }

  return <></>
}

interface DepositDisclaimerProps {
  vault: Vault
}

const DepositDisclaimer = (_props: DepositDisclaimerProps) => {
  return null
}
