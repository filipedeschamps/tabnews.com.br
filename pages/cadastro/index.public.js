import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { CgTab } from 'react-icons/cg';
import { MdOutlineEmail } from 'react-icons/md';
import { AiOutlineUser } from 'react-icons/ai';
import { RiLockPasswordLine } from 'react-icons/ri';

export default function Home() {
  return (
    <div className="pl-3 pr-3">
      <header className="m-auto max-w-7xl">
        <nav className="flex items-center justify-between pt-2 pb-2 mb-3 border-b-2 border-gray-200">
          <div className="flex items-center space-x-1 text-gray-800">
            <CgTab className="w-5 h-5" />
            <a className="text-sm font-medium" href="/">
              TabNews
            </a>
          </div>
        </nav>
      </header>
      <div className="container m-auto mt-8">
        <SignUp />
      </div>
    </div>
  );
}

function SignUp() {
  const usernameRef = useRef('');
  const emailRef = useRef('');
  const passwordRef = useRef('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorAction, setErrorAction] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();

    const username = usernameRef.current.value;
    const email = emailRef.current.value;
    const password = passwordRef.current.value;

    if (username && email && password) {
      setErrorMessage('');
      setErrorAction('');
      setIsLoading(true);

      try {
        const userBody = JSON.stringify({
          username: username,
          email: email,
          password: password,
        });

        const response = await fetch(`/api/v1/users`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: userBody,
        });

        const data = await response.json();

        if (data.status_code >= 400) {
          setErrorMessage(`${data.message}`);
          setErrorAction(`${data.action}`);
          return;
        }

        localStorage.setItem('@tabnews:userEmail', email);
        router.push('/cadastro/confirmar');
      } catch (error) {
        setErrorMessage(`Algum erro ocorreu. Tente novamente.`);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
      setErrorMessage('Preencha todos os campos.');
    }
  }

  return (
    <div className="max-w-4xl m-auto">
      <div className="flex justify-center align-center font-sans">
        <div className="flex-col overflow-hidden">
          <h1 className="text-3xl font-semibold text-gray-900">Cadastrar usuário</h1>

          <div className="w-72">
            <form className="w-full bg-white rounded pt-6 pb-8 mb-4" onSubmit={(e) => handleSubmit(e)}>
              <div className="mb-6">
                <label htmlFor="username" className="relative text-gray-600 focus-within:text-gray-600 block">
                  <AiOutlineUser className="pointer-events-none w-6 h-6 absolute top-1/2 transform -translate-y-1/2 left-3" />
                  <input
                    className="shadow appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline block pl-12 h-12"
                    id="username"
                    type="text"
                    placeholder="Nome de usuário"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    minLength={3}
                    ref={usernameRef}
                  />
                </label>
              </div>
              <div className="mb-6">
                <label htmlFor="email" className="relative text-gray-600 focus-within:text-gray-600 block">
                  <MdOutlineEmail className="pointer-events-none w-6 h-6 absolute top-1/2 transform -translate-y-1/2 left-3" />
                  <input
                    className="shadow appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline block pl-12 h-12"
                    id="email"
                    type="email"
                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$"
                    title="E-mail inválido."
                    placeholder="Email"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    ref={emailRef}
                  />
                </label>
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="relative text-gray-600 focus-within:text-gray-600 block">
                  <RiLockPasswordLine className="pointer-events-none w-6 h-6 absolute top-1/2 transform -translate-y-1/2 left-3" />
                  <input
                    className="appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline block pl-12 h-12"
                    id="password"
                    type="password"
                    placeholder="Senha"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    minLength={8}
                    ref={passwordRef}
                  />
                </label>
              </div>
              {errorMessage && (
                <p className="mb-6 text-center">
                  ⚠ <strong>{errorMessage}</strong>
                  <br />
                  {errorAction}
                </p>
              )}
              <div className="flex items-center justify-between">
                <button
                  className={`bg-blue-600 hover:bg-blue-500 transition delay-30 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline h-12 w-full ${
                    isLoading && 'cursor-progress'
                  }`}
                  type="submit"
                  disabled={isLoading}>
                  {isLoading ? <Loading /> : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <span
      className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-gray-300 border-t-gray-400"
      role="status"
    />
  );
}
