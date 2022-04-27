import Header from 'pages/interface/components/Header/index.js';

export default function DefaultLayout({ children }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
