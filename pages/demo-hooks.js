import React from 'react'
import Image from '../components/Image'
import useWindowConstraints from '../hooks/useWindowConstraints'


const WindowConstraints = React.memo(() => {
  const { height, width, scrollX, scrollY } = useWindowConstraints()

  return (
    <div className="w-full fixed">
      <span> <strong>height:</strong> {height} </span>
      <span> <strong>width:</strong> {width} </span>
      <span> <strong>scrollX:</strong> {scrollX} </span>
      <span> <strong>scrollY:</strong> {scrollY} </span>
    </div>
  )
})


export default function DemoHooks() {
  const numberOfImages = 10

  return (
    <>
      <WindowConstraints />
      <div className="w-full flex-col flex items-center justify-center">
          <div className="flex flex-col items-center justify-center mt-2">
            {Array.from(Array(numberOfImages).keys()).map((_, index) => (
              <>
                {index > 0 && <div className="py-1"/>}
                <Image width="400px" height="400px" src={`https://picsum.photos/400/400?rand=${Math.random()}`} />
              </>
            ))}
          </div>
      </div>
    </>
  )
}
