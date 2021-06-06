import React, { useState } from "react";
import {
  FiPlusSquare,
  FiSearch,
  FiChevronRight,
  FiClock,
} from "react-icons/fi";
import Head from "next/head";

const newsItems = [
  {
    coins: "1132",
    author: "gustavodeschamps",
    title: "STF teria sofrido ataque hacker",
    date: "45 minutos atrás",
    comment:
      "Já vivenciei situações assim, e o caos se instala ou não conforme o poder de alinhamento que o líder tem. Agora, algo que não se pode negligenciar é o nível de ego presente nas pessoas, pois isso atrapalha muito!",
  },
  {
    coins: "954",
    author: "filipedeschamps",
    title:
      "WhatsApp volta atrás e não vai mais desativar contas que não aceitarem nova política de privacidade",
    date: "2 horas atrás",
    comment:
      "O que eu fico feliz com toda essa história é que quem está tocando essas mudanças dentro do Facebook não poderia esperar uma rejeição tão grande.",
  },
  {
    coins: "430",
    author: "arenata",
    title:
      "Reações nucleares estão sendo reativadas novamente em Chernobyl, 35 anos após acidente",
    date: "1 minuto atrás",
  },
  {
    coins: "122",
    author: "gustavodeschamps",
    title: "Alerta para golpe do WhatsApp voltado ao Dia das Mães",
    date: "4 horas atrás",
    comment: "Eu recebi um desses golpes, olha só essa imagem:",
  },
  {
    coins: "59",
    author: "gustavodeschamps",
    title:
      "Supermercado na Polônia vai testar IA para reduzir desperdício de alimentos",
    date: "40 minutos atrás",
    comment:
      "Toda ferramenta pode ser usada para o mal e para o bem, e nesse caso, para o bem.",
  },
  {
    coins: "201",
    author: "gustavodeschamps",
    title:
      "Programa que conserta e doa computadores já entregou mais de 20 mil equipamentos",
    date: "5 horas atrás",
  },
  {
    coins: "83",
    author: "gustavodeschamps",
    title:
      "Software pirata leva a ataque ransomware em instituto europeu de pesquisa biomolecular",
    date: "12 horas atrás",
  },
  {
    coins: "340",
    author: "gustavodeschamps",
    title: "Nova Iorque pode banir mineração de moedas digitais",
    date: "13 horas atrás",
  },
  {
    coins: "500",
    author: "gustavodeschamps",
    title:
      "Starlink ameaça cortar internet de usuário após download ilegal de série de TV",
    date: "15 horas atrás",
  },
  {
    coins: "944",
    author: "gustavodeschamps",
    title: "STF teria sofrido ataque hacker",
    date: "45 minutos atrás",
  },
  {
    coins: "950",
    author: "filipedeschamps",
    title:
      "WhatsApp volta atrás e não vai mais desativar contas que não aceitarem nova política de privacidade",
    date: "2 horas atrás",
  },
  {
    coins: "500",
    author: "arenata",
    title:
      "Reações nucleares estão sendo reativadas novamente em Chernobyl, 35 anos após acidente",
    date: "1 minuto atrás",
  },
  {
    coins: "160",
    author: "gustavodeschamps",
    title: "Alerta para golpe do WhatsApp voltado ao Dia das Mães",
    date: "4 horas atrás",
  },
  {
    coins: "5",
    author: "gustavodeschamps",
    title:
      "Supermercado na Polônia vai testar IA para reduzir desperdício de alimentos",
    date: "40 minutos atrás",
  },
  {
    coins: "201",
    author: "gustavodeschamps",
    title:
      "Programa que conserta e doa computadores já entregou mais de 20 mil equipamentos",
    date: "5 horas atrás",
  },
  {
    coins: "83",
    author: "gustavodeschamps",
    title:
      "Software pirata leva a ataque ransomware em instituto europeu de pesquisa biomolecular",
    date: "12 horas atrás",
  },
  {
    coins: "340",
    author: "gustavodeschamps",
    title: "Nova Iorque pode banir mineração de moedas digitais",
    date: "13 horas atrás",
  },
  {
    coins: "500",
    author: "gustavodeschamps",
    title:
      "Starlink ameaça cortar internet de usuário após download ilegal de série de TV",
    date: "15 horas atrás",
  },
];

const Layout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(true);

  return (
    <>
      <header className="flex justify-between py-2 pl-8 border border-gray-100 items-center">
        <div className="left-side">
          <div className="logo text-xl font-bold">TabNews</div>
        </div>

        <div className="right-side flex gap-4 items-center">
          <div className="search bg-gray-50 rounded-sm p-2 flex items-center">
            <input
              type="text"
              placeholder="Buscar por conteúdo"
              className="bg-transparent"
            />
            <FiSearch />
          </div>

          <button className="border-none bg-purple-500 rounded-sm flex items-center text-white py-2 px-3">
            <FiPlusSquare className="mr-2" />
            <span>Informar</span>
          </button>

          <div className="user-area flex items-center w-72 px-4">
            <div className="user-avatar">
              <img
                className="rounded-full h-9 w-9 mr-2 flex-shrink-0 "
                src="https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"
                alt=""
              />
            </div>
            <span className="user-name text-sm flex-1">@nomedeusuario</span>

            <FiChevronRight size={22} />
          </div>
        </div>
      </header>

      <div className="content flex">
        <main className="flex-1">{children}</main>

        <aside
          className="w-72 border-l p-4"
          style={{ height: "calc(100vh - 58px)" }}
        >
          teste
        </aside>
      </div>
    </>
  );
};

const FeaturedNews = () => {
  return (
    <div
      className="flex-1 flex flex-col justify-end rounded-md bg-gray-200 p-4"
      style={{ height: 230 }}
    >
      <h3 className="font-bold text-3xl">STF teria sofrido ataque hacker</h3>
      <time className="text-md flex items-center mt-2">
        <FiClock className="mr-2" />
        Hoje às 18:30
      </time>
    </div>
  );
};

const NewsCard = ({ data }) => {
  return (
    <div className="flex border-gray-100 border p-4 rounded-md mb-4">
      <h3 className="font-bold text-xl">{data.title}</h3>
      <time className="text-sm">Hoje às 18:30</time>
    </div>
  );
};

const HomePage = () => {
  return (
    <>
      <Head>
        <title>TabNews - Drops diários de notícias</title>
      </Head>
      <Layout>
        <div className="grid container mx-auto grid-cols-12 gap-8 mt-8">
          <div className="col-span-9">
            <section className="featured flex gap-4  mb-8">
              <FeaturedNews />
              <FeaturedNews />
              <FeaturedNews />
            </section>
            <section className="trending-news">
              {newsItems.map((item) => (
                <NewsCard data={item} />
              ))}
            </section>
          </div>
          <aside className="col-span-3">
            asdddddddddddddddddddddddddddddd asdddddd dddddddddddddddddddddddd
            asddddddddddddddddddddddddddddd dasddddddddddd ddddddddddddddddddd
          </aside>
        </div>
      </Layout>
    </>
  );
};

export default HomePage;
