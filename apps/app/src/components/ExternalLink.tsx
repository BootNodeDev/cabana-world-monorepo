import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import classNames from 'classnames'
import { ReactNode } from 'react'

export interface ExternalLinkProps {
  href: string
  children: ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  iconClassName?: string
}

export const ExternalLink = (props: ExternalLinkProps) => {
  return null
}
