import { MODAL_KEYS, useIsModalOpen } from '@shared/generic-react-hooks'
import { SocialIcon } from '@shared/ui'
import { LINKS } from '@shared/utilities'
import classNames from 'classnames'
import { Footer as FlowbiteFooter } from 'flowbite-react'
import { useTranslations } from 'next-intl'
import { ReactNode, useEffect, useState } from 'react'
import { useSettingsModalView } from '@hooks/useSettingsModalView'

interface FooterItem {
  title: string
  content: FooterItemContentProps[]
  className?: string
  titleClassName?: string
  itemClassName?: string
}

export const Footer = () => {
  return null
}

interface FooterItemContentProps {
  content: ReactNode
  href?: string
  icon?: JSX.Element
  onClick?: () => void
  disabled?: boolean
}

const FooterItemContent = (props: FooterItemContentProps & { className?: string }) => {
  const { content, href, icon, onClick, disabled, className } = props

  const baseClassName = 'flex items-center gap-2 whitespace-nowrap'

  if (disabled) {
    return (
      <span className={classNames(baseClassName, 'text-pt-purple-300', className)}>
        {icon}
        {content}
      </span>
    )
  }

  if (!!href) {
    return (
      <FlowbiteFooter.Link theme={{ base: '' }} href={href} className={classNames(className)}>
        <span className={classNames(baseClassName)}>
          {icon}
          {content}
        </span>
      </FlowbiteFooter.Link>
    )
  }

  return (
    <span
      className={classNames(
        baseClassName,
        { 'cursor-pointer hover:underline': onClick !== undefined },
        className
      )}
      onClick={onClick}
    >
      {icon}
      {content}
    </span>
  )
}
