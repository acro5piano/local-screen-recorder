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
    <div className="flex justify-center items-center h-full bg-slate-800 text-slate-100">
      <div className="w-96 h-96 border rounded p-8 flex flex-col justify-between">
        <div className="flex justify-between">
          <div className="text-2xl font-bold">Screen Recorder</div>
        </div>
        <div className="">
          {match(isStarted)
            .with(true, () => <Button onClick={onClickEnd}>End</Button>)
            .with(false, () => <Button onClick={onClickStart}>Start</Button>)
            .exhaustive()}
        </div>
      </div>
    </div>
  )
}

const Button = (props: React.ComponentProps<'button'>) => (
  <button
    className="bg-slate-100 text-slate-800 rounded px-4 py-1 shadow-md w-full font-bold"
    {...props}
  />
)
