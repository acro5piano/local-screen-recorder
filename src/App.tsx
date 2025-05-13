import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { match } from 'ts-pattern'
import { startRecording, StartRecordingOption } from './recorder'
import useLocalStorageState from 'use-local-storage-state'
import { Button } from './components/Button'

export const App = () => {
  const [isStarted, setIsStarted] = useState(false)
  const endRecording = useRef<() => Promise<void>>()

  const [option, setOption] = useLocalStorageState<StartRecordingOption>(
    'option',
    {
      defaultValue: {
        enableMic: true,
        enableAudio: true,
        enableScreen: true,
      },
    },
  )

  const { register, handleSubmit } = useForm({
    defaultValues: option,
  })

  const onClickStart = handleSubmit(async (option) => {
    if (isStarted) {
      return
    }
    setOption(option)
    setIsStarted(true)
    const onEnd = await startRecording(option)
    endRecording.current = onEnd
  })

  const onClickEnd = async () => {
    await endRecording.current?.()
    setIsStarted(false)
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
              .with(false, () => (
                <Button type="button" onClick={onClickStart}>
                  Start
                </Button>
              ))
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
