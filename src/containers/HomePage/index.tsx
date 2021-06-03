import React from "react";
import Head from "next/head";
import Layout from "../../components/Layout";

const HomePage: React.FC = () => {
  return (
    <>
      <Head>
        <title>TabNews - Drops diários de notícias</title>
      </Head>
      <Layout>Conteúdo</Layout>
    </>
  );
};

export default HomePage;
