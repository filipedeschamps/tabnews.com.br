import ReactConfetti from 'react-confetti';
import { useEffect, useState } from 'react';

export default function Confetti({
  width = 0,
  height = 0,
  recycle = false,
  numberOfPieces = 800,
  tweenDuration = 15000,
  gravity = 0.15,
  ...props
}) {
  const [confettiWidth, setConfettiWidth] = useState(width);
  const [confettiHeight, setConfettiHeight] = useState(height);

  useEffect(() => {
    function handleResize() {
      setConfettiWidth(document.body.clientWidth);
      setConfettiHeight(window.innerHeight);
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ReactConfetti
      width={confettiWidth}
      height={confettiHeight}
      recycle={false}
      numberOfPieces={800}
      tweenDuration={15000}
      gravity={0.15}
      {...props}
    />
  );
}
