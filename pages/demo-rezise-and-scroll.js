import React from 'react';
import useWindowConstraints from '../hooks/useWindowConstraints'

export default function pages() {
  const { height, width, scrollX, scrollY } = useWindowConstraints()

  return <div>
    <p>height: {height}</p>
    <p>width: {width}</p>
    <p>scrollX: {scrollX}</p>
    <p>scrollY: {scrollY}</p>
  </div>;
}

