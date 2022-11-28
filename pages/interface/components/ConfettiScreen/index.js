import Confetti from 'react-confetti';

export default function ConfettiScreen({ children, showConfetti }) {
  const { width, height } = useResize();

  const options = {
    width,
    height,
    recycle: false,
    numberOfPieces: 800,
    tweenDuration: 15000,
    gravity: 0.15,
  };

  return (
    <>
      {showConfetti && <Confetti {...options} />}
      {children}
    </>
  );
}
