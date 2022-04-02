import { useRouter } from 'next/router';

import { CgTab } from 'react-icons/cg';

export default function ActiveUser() {
  const router = useRouter();
  const { token } = router.query;

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

      <div className="flex justify-center my-8">
        <section className="flex text-center items-center">
          <h2 className="py-2 ml-2">{token}</h2>
        </section>
      </div>
    </>
  );
}
