import Countdown, { CountdownRenderProps } from 'react-countdown'
import { useNextDrawTime } from '../hooks'

// Custom renderer to format as "d h m s"
const renderCountdown = (props: CountdownRenderProps) => {
  const { days, hours, minutes, seconds, completed } = props
  if (completed) {
    return <div>Se sortea en: 0d 0h 0m 0s</div>
  }
  return (
    <div>
      Se sortea en: {days}d {hours}h {minutes}m {seconds}s
    </div>
  )
}

/**
 * Displays the next draw time for the prize pool
 * Shows: "Se sortea en: Xd Xh Xm Xs"
 */
export const PTNextDrawTime = () => {
  const { data: nextDrawTimestamp, isFetched } = useNextDrawTime()

  if (!isFetched) {
    return <div>Cargando próximo sorteo...</div>
  }

  if (!nextDrawTimestamp) {
    return <div>Se sortea en: No disponible</div>
  }

  // Convert seconds to milliseconds for Countdown component
  const targetDate = nextDrawTimestamp * 1000

  return <Countdown date={targetDate} renderer={renderCountdown} />
}

