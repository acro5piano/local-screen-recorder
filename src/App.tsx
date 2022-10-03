import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { match } from 'ts-pattern'
import { startRecording } from './recorder'

export const App = () => {
  const [isStarted, setIsStarted] = useState(false)
  const endRecording = useRef<() => Promise<void>>()

  const { register, handleSubmit } = useForm({
    defaultValues: {
      enableMic: true,
      enableAudio: true,
      enableScreen: true,
    },
  })

  const onClickStart = handleSubmit(async (option) => {
    setIsStarted(true)
    const onEnd = await startRecording(option)
    endRecording.current = onEnd
  })

  const onClickEnd = async () => {
    setIsStarted(false)
    await endRecording.current?.()
  }

  return (
    <div className="flex justify-center items-center h-full bg-slate-800 text-slate-100">
      <form onSubmit={onClickStart}>
        <div className="w-96 h-96 sm:border rounded p-8 flex flex-col justify-between">
          <div className="flex justify-between">
            <div className="text-2xl font-bold">Screen Recorder</div>
          </div>
          <div className="">
            <label className="flex justify-between items-center">
              Enable Mic
              <input type="checkbox" {...register('enableMic')} />
            </label>
            <label className="flex justify-between items-center">
              Enable Computer Audio
              <input type="checkbox" {...register('enableAudio')} />
            </label>
            <label className="flex justify-between items-center">
              Enable Screen
              <input type="checkbox" disabled {...register('enableScreen')} />
            </label>
          </div>
          <div className="">
            {match(isStarted)
              .with(false, () => <Button type="submit">Start</Button>)
              .with(true, () => (
                <Button type="button" onClick={onClickEnd}>
                  End
                </Button>
              ))
              .exhaustive()}
          </div>
        </div>
      </form>
    </div>
  )
}

const Button = (props: React.ComponentProps<'button'>) => (
  <button
    className="bg-slate-100 text-slate-800 rounded px-4 py-1 shadow-md w-full font-bold"
    {...props}
  />
)
