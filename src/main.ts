async function start() {
  const audio: MediaStream | null = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
    })
    .catch(() => null)

  const screen = await navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: true,
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

  document.getElementById('end').addEventListener('click', end)
}

document.getElementById('start').addEventListener('click', start)
