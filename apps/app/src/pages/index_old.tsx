import { useOpenUrl } from '@coinbase/onchainkit/minikit'
import { Button } from '@shared/ui'
import { LINKS, SECONDS_PER_DAY } from '@shared/utilities'
import classNames from 'classnames'
import { GetStaticProps } from 'next'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { getMessages } from 'src/utils'
import { HomeHeader } from '@components/HomeHeader'
import { Layout } from '@components/Layout'
import { PrizePoolCards } from '@components/Prizes/PrizePoolCards'

interface HomePageProps {
  messages: IntlMessages
}

export const getStaticProps: GetStaticProps<HomePageProps> = async ({ locale }) => {
  const messages = await getMessages(locale)

  return {
    props: { messages },
    revalidate: SECONDS_PER_DAY
  }
}

export default function HomePage() {
  const t = useTranslations('Common')

  return (
    <Layout className='gap-8'>
      <HomeHeader />

      <Link href='/vaults' passHref={true}>
        <Button>{t('depositToWin')}</Button>
      </Link>
      <PrizePoolCards />
      <CabanaPoweredBy />
    </Layout>
  )
}

const CabanaPoweredBy = (props: { className?: string }) => {
  const { className } = props

  const t = useTranslations('Common')

  const openUrl = useOpenUrl()

  return (
    <div className={classNames('flex gap-2 items-center', className)}>
      {t('cabanaPoweredBy')}
      <button onClick={() => openUrl(LINKS.protocolLandingPage)}>
        <img
          src='/pooltogether-logo.svg'
          alt='PoolTogether Logo'
          width={183}
          height={72}
          className='w-24 h-auto'
        />
      </button>
    </div>
  )
}
