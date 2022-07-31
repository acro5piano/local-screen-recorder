async function start() {
  const audio = await navigator.mediaDevices.getUserMedia({
    audio: true,
  })

  const screen = await navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: true,
  })

  const stream = new MediaStream([...screen.getTracks(), ...audio.getTracks()])
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
    recorder.stop()
    const link = document.createElement('a')
    const url = window.URL.createObjectURL(
      new Blob(blobs, { type: 'video/webm' }),
    )
    link.download = `image-annotator-com-${new Date()}.webm`
    link.href = url
    link.click()
  }

  document.getElementById('end').addEventListener('click', end)
}

document.getElementById('start').addEventListener('click', start)
