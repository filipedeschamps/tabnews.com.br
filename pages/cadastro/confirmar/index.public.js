import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { CgTab } from "react-icons/cg";

export default function ConfirmSignup() {
  const [confettiWidth, setConfettiWidth] = useState(0);
  const [confettiHeight, setConfettiHeight] = useState(0);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const userEmail = localStorage.getItem('@tabnews:userEmail')
    setEmail(userEmail)

    function handleResize() {
      setConfettiWidth(window.screen.width);
      setConfettiHeight(window.screen.height);
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <style>{`
        body {
          overflow-x: hidden;
          overflow-y: hidden;
        }
      `}</style>
    <div className="pl-3 pr-3">
      <Confetti
        width={confettiWidth}
        height={confettiHeight}
        recycle={false}
        numberOfPieces={800}
        tweenDuration={15000}
        gravity={0.15}
      />
      <header className="m-auto max-w-7xl">
        <nav className="flex items-center justify-between pt-2 pb-2 mb-3 border-b-2 border-gray-200">
          <div className="flex items-center space-x-1 text-gray-800">
            <CgTab className="w-5 h-5" />
            <a className="text-sm font-medium" href="/">TabNews</a>
          </div>
        </nav>
      </header>

      <div className="container m-auto mt-8">
        <div className="max-w-xl m-auto">
          <div className="flex justify-center align-center font-sans">
            <div className="flex-col overflow-hidden">
              <h1 className="text-3xl font-semibold text-gray-900 text-center mb-6">
                Cadastro realizado com sucesso!
              </h1>
              <h1 className="sm:text-3xl text-xl font-semibold text-gray-900 text-center">
                Confira seu e-mail: {email}
              </h1>
              <p className="p-4 text-center">
                Inclusive a <b>Caixa de Spam</b>, para ativar e confirmar sua inscrição.
              </p>
            </div>
          </div>
        </div>
    </div>
    </div>
    </>
  );
}
