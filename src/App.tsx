import { useState } from 'react'

export const App = () => {
  const [isStarted, setIsStarted] = useState(false)

  return (
    <div className="">
      <button id="start">start</button>
      <button id="end">end</button>
    </div>
  )
}
