import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import fetch from 'cross-fetch';

import { CgTab, CgCheck, CgClose } from 'react-icons/cg';

export default function ActiveUser() {
  const router = useRouter();
  const { token } = router.query;

  const [userFeedback, setUserFeedback] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleActivateUser = async (token) => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/v1/activate/${token}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.features) {
        setUserFeedback('Usuário Ativado com Sucesso!');
        setIsSuccess(true);
      } else {
        setUserFeedback(data.message);
        setIsSuccess(false);
      }

    } catch (err) {
      console.log({ err });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      handleActivateUser(token);
    }
  }, [token]);

  return (
    <>
      <header className="border-b-2 border-gray-200">
        <nav className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-1">
            <CgTab className="w-5 h-5 text-gray-700" />
            <span className="text-sm font-medium">TabNews</span>
          </div>
        </nav>
      </header>

      {isLoading ? (
        <p className="flex justify-center my-8">Carregando...</p>
      ) : (
        <div className="flex justify-center my-8">
          <section className="flex text-center items-center">
            {isSuccess ? <CgCheck className="w-5 h-5 text-green-600" /> : <CgClose className="w-5 h-5 text-red-500" />}
            <h2 className="py-2 ml-2">{userFeedback}</h2>
          </section>
        </div>
      )}
    </>
  );
}
