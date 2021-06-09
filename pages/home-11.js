import React from "react";
import {
  FiPlusSquare,
  FiSearch,
  FiClock,
  FiMessageSquare,
  FiSkipForward,
  FiSkipBack,
  FiPlay,
  FiDollarSign,
  FiYoutube,
  FiInfo,
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
  return (
    <>
      <header className="flex justify-between py-2 pl-8 border border-gray-100 items-center fixed top-0 left-0 bg-white w-full h-14">
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

          <button className="border-none bg-purple-500 rounded-sm flex items-center text-white py-2 px-3 hover:bg-purple-600">
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

            {/* <FiChevronRight size={22} /> */}
          </div>
        </div>
      </header>

      <aside
        className="w-72 border-l p-4 flex flex-col justify-between fixed top-14 right-0"
        style={{ height: "calc(100vh - 58px)" }}
      >
        <div>
          <div className="bg-purple-500  rounded-md p-6 flex items-center">
            <FiDollarSign size={46} className="text-pink-200" />
            <span className="text-pink-200 font-bold text-3xl ml-4">
              860 T$
            </span>
          </div>

          <div className="mt-6">
            <h4 className="text-lg mb-2">últimas ações</h4>

            {Array(5)
              .fill(5)
              .map(() => (
                <div className="border rounded-md p-2 flex items-center border-gray-100 mt-2">
                  <div className="p-2 bg-purple-100 rounded-full mr-2">
                    <FiMessageSquare size={22} />
                  </div>
                  <span className="text-sm">comentou em um post</span>
                </div>
              ))}
          </div>
        </div>

        <div className="player bg-gray-50 p-6 flex flex-col items-center rounded-md">
          <div className="flex justify-center items-center h-24">
            <h3 className="text-xl font-bold text-center">
              STF teria sofrido ataque hacker
            </h3>
          </div>

          <div className="mt-6">
            <div className="w-full h-2 bg-gray-200 rounded-md mb-4">
              <div className="w-3/5 h-2 bg-purple-600 rounded-md mb-4" />
            </div>
            <div className="flex gap-4">
              <button className="rounded-full p-3 hover:bg-warmGray-200">
                <FiSkipBack size={22} />
              </button>
              <button className="bg-purple-500 rounded-full p-3 hover:bg-purple-600">
                <FiPlay size={22} color="#fff" />
              </button>
              <button className="rounded-full p-3 hover:bg-warmGray-200">
                <FiSkipForward size={22} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="content flex mt-14">
        <main className="flex-1">{children}</main>
        <div className="w-72"></div>
      </div>
    </>
  );
};

const FeaturedNews = () => {
  return (
    <div
      className="flex-1 flex flex-col justify-end rounded-md bg-gray-200 p-4"
      style={{
        height: 230,
        background: `url(
          "https://www12.senado.leg.br/noticias/materias/2020/06/16/stf-acata-defesa-do-senado-e-julga-constitucional-lei-da-terceirizacao/20190430_00384pf.jpg/@@images/image/imagem_materia"
        ), linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.85) 100%)`,
        backgroundSize: "cover",
        backgroundBlendMode: "darken",
      }}
    >
      <h3 className="font-bold text-3xl text-white">
        STF teria sofrido ataque hacker
      </h3>
      <time className="text-md flex items-center mt-2 text-white">
        <FiClock className="mr-2" />
        Hoje às 18:30
      </time>
    </div>
  );
};

const NewsCard = ({ data }) => {
  return (
    <div className="flex border-gray-100 border p-4 rounded-md mb-4">
      <div className="flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="font-bold text-xl">{data.title}</h3>
          <p className="text-gray-600 text-sm mt-1">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas
            volutpat nisi sit amet tellus semper interdum. Nullam pharetra
            semper tristique. Mauris rhoncus tempor sapien, dictum cursus ipsum.
            Nam feugiat urna nunc, a iaculis eros scelerisque sit amet. Praesent
            eu finibus velit
          </p>
        </div>
        <footer className="flex items-center mt-4">
          <time className="text-sm">{data.date}</time>
          <div className="h-5 w-0 border-l border-gray-200 mx-4"></div>
          <div className="flex items-center">
            <div className="user-avatar">
              <img
                className="rounded-full h-5 w-5 mr-2 flex-shrink-0 "
                src="https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"
                alt=""
              />
            </div>
            <span className="user-name text-sm flex-1">@{data.author}</span>
          </div>
        </footer>
      </div>
      <div className="actions flex flex-col justify-center gap-4 ml-4 p-1">
        <button type="button" className="flex flex-col items-center">
          <FiMessageSquare size={24} className="mb-1" />
          <span className="text-sm">123</span>
        </button>
        <button type="button" className="flex flex-col items-center">
          <img src="/svg/tab-coin.svg" className="mb-1 h-6" />
          <span className="text-sm">{data.coins}</span>
        </button>
      </div>
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
            <div className="sticky top-20 flex justify-center w-full">
              <div className="ad bg-gray-100 p-8 rounded-md flex justify-center items-center flex-col max-w-xs">
                <img
                  src="https://yt3.ggpht.com/ytc/AAUvwnjmOwHGXldA8NPXJ4vIFtA4334qT5fspJMPoM4p=s900-c-k-c0x00ffffff-no-rj"
                  className="rounded-md w-3/5"
                />
                <h3 className="font-bold text-2xl mt-4">Filipe Deschamps</h3>
                <p className="text-sm text-gray-600 text-center leading-5 mt-1">
                  Vídeos sobre tecnologia e programação
                </p>
                <button className="bg-red-600 text-white flex items-center px-4 py-2 rounded-md mt-4">
                  <FiYoutube size={20} className="mr-2" />
                  <span>Inscrever-se</span>
                </button>

                <div className="flex items-center text-gray-500 mt-6">
                  <FiInfo className="mr-1" size={16} />
                  <span className="text-xs">Anúncio por Filipe Deschamps</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </Layout>
    </>
  );
};

export default HomePage;
