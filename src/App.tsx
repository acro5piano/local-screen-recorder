import { useRef, useState } from 'react'
import { match } from 'ts-pattern'
import { startRecording } from './recorder'

export const App = () => {
  const [isStarted, setIsStarted] = useState(false)
  const endRecording = useRef<() => Promise<void>>()

  const onClickStart = async () => {
    setIsStarted(true)
    const onEnd = await startRecording()
    endRecording.current = onEnd
  }

  const onClickEnd = async () => {
    setIsStarted(false)
    await endRecording.current?.()
  }

  return (
    <div className="">
      {match(isStarted)
        .with(true, () => <button onClick={onClickEnd}>End</button>)
        .with(false, () => <button onClick={onClickStart}>Start</button>)
        .exhaustive()}
    </div>
  )
}
