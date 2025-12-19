export interface StartRecordingOption {
  enableMic: boolean
  enableAudio: boolean
  enableScreen: boolean
  enableCamera: boolean
}

export async function startRecording(option: StartRecordingOption) {
  const screen = await navigator.mediaDevices.getDisplayMedia({
    audio: option.enableAudio,
    video: option.enableScreen,
  })

  const tracks: MediaStreamTrack[] = []
  const audioSources: MediaStream[] = []

  // Get screen video track
  const screenVideoTrack = screen.getVideoTracks()[0]
  let cameraStream: MediaStream | null = null
  let animationFrameId: number | null = null
  let canvas: HTMLCanvasElement | null = null
  let screenVideo: HTMLVideoElement | null = null
  let cameraVideo: HTMLVideoElement | null = null

  // Get camera stream if enabled
  if (option.enableCamera) {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
      })
    } catch (e) {
      console.error('could not get camera: ', e)
    }
  }

  // If camera is enabled and we have both streams, composite them
  if (cameraStream && screenVideoTrack) {
    const screenSettings = screenVideoTrack.getSettings()
    const width = screenSettings.width || 1920
    const height = screenSettings.height || 1080

    // Create canvas for compositing
    canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    // Create video elements for screen and camera
    screenVideo = document.createElement('video')
    screenVideo.srcObject = new MediaStream([screenVideoTrack])
    screenVideo.muted = true
    screenVideo.play()

    cameraVideo = document.createElement('video')
    cameraVideo.srcObject = cameraStream
    cameraVideo.muted = true
    cameraVideo.play()

    // Camera overlay settings (bottom-left, circular)
    const camSize = Math.min(width, height) * 0.2 // 20% of smaller dimension
    const camMargin = 20
    const camX = camMargin
    const camY = height - camSize - camMargin

    // Compositing loop
    function drawFrame() {
      if (!ctx || !screenVideo || !cameraVideo || !canvas) return

      // Draw screen capture as background
      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height)

      // Draw camera as circular overlay in bottom-left
      ctx.save()
      ctx.beginPath()
      ctx.arc(camX + camSize / 2, camY + camSize / 2, camSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()

      // Draw camera video scaled to fit the circle
      const camVideoWidth = cameraVideo.videoWidth || 320
      const camVideoHeight = cameraVideo.videoHeight || 240
      const camAspect = camVideoWidth / camVideoHeight
      let drawWidth = camSize
      let drawHeight = camSize
      let offsetX = 0
      let offsetY = 0

      if (camAspect > 1) {
        drawWidth = camSize * camAspect
        offsetX = -(drawWidth - camSize) / 2
      } else {
        drawHeight = camSize / camAspect
        offsetY = -(drawHeight - camSize) / 2
      }

      ctx.drawImage(cameraVideo, camX + offsetX, camY + offsetY, drawWidth, drawHeight)
      ctx.restore()

      // Draw circle border
      ctx.beginPath()
      ctx.arc(camX + camSize / 2, camY + camSize / 2, camSize / 2, 0, Math.PI * 2)
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 3
      ctx.stroke()

      animationFrameId = requestAnimationFrame(drawFrame)
    }

    // Wait for videos to be ready
    await Promise.all([
      new Promise<void>((resolve) => {
        screenVideo!.onloadedmetadata = () => resolve()
      }),
      new Promise<void>((resolve) => {
        cameraVideo!.onloadedmetadata = () => resolve()
      }),
    ])

    drawFrame()

    // Capture canvas as video track
    const canvasStream = canvas.captureStream(30)
    const canvasVideoTrack = canvasStream.getVideoTracks()[0]
    if (canvasVideoTrack) {
      tracks.push(canvasVideoTrack)
    }
  } else if (screenVideoTrack) {
    // No camera, just use screen video directly
    tracks.push(screenVideoTrack)
  }

  // Collect tab/system audio
  const tabAudioTrack = screen.getAudioTracks()[0]
  if (tabAudioTrack) {
    audioSources.push(new MediaStream([tabAudioTrack]))
  }

  // Collect mic audio
  if (option.enableMic) {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })
      audioSources.push(micStream)
    } catch (e) {
      console.error('could not get mic audio: ', e)
    }
  }

  // Mix audio sources using Web Audio API
  let audioContext: AudioContext | null = null
  if (audioSources.length > 0) {
    audioContext = new AudioContext()
    const destination = audioContext.createMediaStreamDestination()

    for (const source of audioSources) {
      const sourceNode = audioContext.createMediaStreamSource(source)
      sourceNode.connect(destination)
    }

    const mixedAudioTrack = destination.stream.getAudioTracks()[0]
    if (mixedAudioTrack) {
      tracks.push(mixedAudioTrack)
    }
  }

  const stream = new MediaStream(tracks)
  const recorder = new MediaRecorder(stream)

  const blobs: Blob[] = []

  recorder.ondataavailable = (event) => {
    if (!event.data.size) {
      return
    }
    blobs.push(event.data)
  }

  recorder.start(5000)

  screen.getTracks().forEach((track) => {
    track.onended = () => {
      recorder.stop()
    }
  })

  recorder.onstop = async () => {
    await end()
  }

  async function end() {
    recorder.onstop = null
    try {
      recorder.stop()
    } catch {
      console.log('already stopped')
    }
    for (const track of stream.getTracks()) {
      try {
        track.stop()
      } catch {
        console.log('already stopped')
      }
    }
    // Stop original screen tracks
    for (const track of screen.getTracks()) {
      try {
        track.stop()
      } catch {
        console.log('already stopped')
      }
    }
    // Stop audio source streams
    for (const source of audioSources) {
      for (const track of source.getTracks()) {
        try {
          track.stop()
        } catch {
          console.log('already stopped')
        }
      }
    }
    // Close audio context
    if (audioContext) {
      await audioContext.close()
    }
    // Stop camera stream
    if (cameraStream) {
      for (const track of cameraStream.getTracks()) {
        try {
          track.stop()
        } catch {
          console.log('already stopped')
        }
      }
    }
    // Cancel animation frame
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    if (blobs.length === 0) {
      alert('too short! please try again')
      return
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
