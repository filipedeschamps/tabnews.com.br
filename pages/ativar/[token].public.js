import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CgTab } from 'react-icons/cg';
import { RiMoneyDollarCircleFill } from 'react-icons/ri';

export default function ActiveUser() {
  const router = useRouter();
  const { token } = router.query;

  const [userActivated, setUserActivated] = useState('');

  async function handleActivate(token) {
    try {
      const response = await fetch(`../api/v1/activate/${token}`)
        .then((response) => response.json())
        .then((data) => data);

      if (response.features) {
        setUserActivated('Usuário Ativado com Sucesso!');
      } else {
        setUserActivated(response.message);
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (token) {
      handleActivate(token);
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
      <div className="flex m-2">
        <div className="bg-gray-100 rounded-md w-96">
          <h1>{userActivated}</h1>
        </div>
        <div className=""></div>
      </div>
    </>
  );
}
