export interface StartRecordingOption {
  enableMic: boolean
  enableAudio: boolean
  enableScreen: boolean
}

export async function startRecording(option: StartRecordingOption) {
  const screen = await navigator.mediaDevices.getDisplayMedia({
    audio: option.enableAudio,
    video: option.enableScreen,
  })

  const tracks: MediaStreamTrack[] = []
  const audioSources: MediaStream[] = []

  // Collect video track
  const videoTrack = screen.getVideoTracks()[0]
  if (videoTrack) {
    tracks.push(videoTrack)
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
