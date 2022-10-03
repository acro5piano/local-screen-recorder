interface StartRecordingOption {
  enableMic: boolean
  enableAudio: boolean
  enableScreen: boolean
}

export async function startRecording(option: StartRecordingOption) {
  let audio: MediaStream | null = null

  if (option.enableMic) {
    try {
      audio = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })
    } catch (e) {
      console.error('could not get audio source: ', e)
    }
  }

  const screen = await navigator.mediaDevices.getDisplayMedia({
    audio: option.enableAudio,
    video: option.enableScreen,
  })

  const stream = audio
    ? new MediaStream([...screen.getTracks(), ...audio?.getTracks()])
    : new MediaStream([...screen.getTracks()])
  const recorder = new MediaRecorder(stream)

  const blobs: Blob[] = []

  recorder.ondataavailable = (event) => {
    if (!event.data.size) {
      return
    }
    blobs.push(event.data)
  }

  recorder.start(5000)

  recorder.onstop = async () => {
    await end()
  }

  async function end() {
    try {
      recorder.stop()
    } catch {
      console.log('already stopped')
    }
    const link = document.createElement('a')
    const url = window.URL.createObjectURL(
      new Blob(blobs, { type: 'video/webm' }),
    )
    link.download = `local-screen-recorder-${new Date().toISOString()}.webm`
    link.href = url
    link.click()
  }

  return end
}
