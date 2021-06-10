import React from "react";
import {
  FiPlusSquare,
  FiSearch,
  FiClock,
  FiMessageSquare,
  FiSkipForward,
  FiSkipBack,
  FiPlay,
  FiYoutube,
  FiInfo,
} from "react-icons/fi";
import Head from "next/head";

function TabCoinIcon(props) {
  return (
    <svg
      viewBox="0 0 31 31"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M15.5 0C7.15192 0 0 7.1518 0 15.5C0 23.8481 7.1518 31 15.5 31C23.8465 31 31 23.8497 31 15.5C31 7.16627 23.8624 0 15.5 0ZM15.5 29.7891C7.88805 29.7891 1.21094 23.112 1.21094 15.5C1.21094 7.88805 7.88805 1.21094 15.5 1.21094C23.112 1.21094 29.7891 7.88805 29.7891 15.5C29.7891 23.112 23.112 29.7891 15.5 29.7891Z"
        fill="currentColor"
      />
      <path
        d="M18.0515 3.93367C17.7263 3.85653 17.3998 4.05749 17.3225 4.38287C17.2453 4.70819 17.4464 5.03459 17.7717 5.11185C22.5517 6.2468 26.1562 10.7128 26.1562 15.5C26.1562 21.1767 21.1767 26.1562 15.5 26.1562C9.82331 26.1562 4.84375 21.1767 4.84375 15.5C4.84375 10.7128 8.44829 6.24686 13.2282 5.11185C13.5536 5.03459 13.7547 4.70819 13.6774 4.38287C13.6002 4.05749 13.2739 3.85635 12.9484 3.93367C7.684 5.18372 3.63281 10.1048 3.63281 15.5C3.63281 21.809 9.14857 27.3672 15.5 27.3672C21.809 27.3672 27.3672 21.8514 27.3672 15.5C27.3672 10.1095 23.3204 5.18475 18.0515 3.93367Z"
        fill="currentColor"
      />
      <path
        d="M15.5 4.9043C15.8344 4.9043 16.1055 4.63322 16.1055 4.29883C16.1055 3.96444 15.8344 3.69336 15.5 3.69336C15.1656 3.69336 14.8945 3.96444 14.8945 4.29883C14.8945 4.63322 15.1656 4.9043 15.5 4.9043Z"
        fill="currentColor"
      />
      <path
        d="M15.3486 13.0327H12.7069V20.2174H10.93V13.0327H8.32385V11.5934H15.3486V13.0327Z"
        fill="currentColor"
      />
      <path
        d="M20.2766 17.9489C20.2766 17.6251 20.1858 17.3684 20.0041 17.1789C19.8264 16.9854 19.5224 16.8077 19.092 16.6458C18.6616 16.4839 18.2904 16.324 17.9784 16.166C17.6665 16.0041 17.398 15.8205 17.1729 15.6152C16.9518 15.4059 16.778 15.1611 16.6517 14.8807C16.5293 14.6004 16.4681 14.2667 16.4681 13.8797C16.4681 13.2124 16.6813 12.6655 17.1078 12.239C17.5342 11.8126 18.1009 11.5638 18.8077 11.4927V10.2252H19.7554V11.5105C20.4543 11.6092 21.0012 11.9014 21.3961 12.3871C21.7909 12.8688 21.9884 13.4947 21.9884 14.2647H20.2766C20.2766 13.7909 20.1779 13.4375 19.9804 13.2045C19.787 12.9676 19.5263 12.8491 19.1986 12.8491C18.8748 12.8491 18.6241 12.9419 18.4464 13.1275C18.2687 13.3091 18.1798 13.5618 18.1798 13.8856C18.1798 14.1857 18.2667 14.4266 18.4404 14.6082C18.6142 14.7899 18.936 14.9755 19.4059 15.165C19.8798 15.3546 20.2687 15.5342 20.5727 15.704C20.8768 15.8699 21.1335 16.0594 21.3427 16.2726C21.552 16.4819 21.712 16.7228 21.8225 16.9952C21.9331 17.2638 21.9884 17.5777 21.9884 17.937C21.9884 18.6083 21.7791 19.1532 21.3605 19.5718C20.942 19.9903 20.3654 20.2371 19.631 20.3122V21.4908H18.6892V20.3181C17.8797 20.2312 17.2519 19.9449 16.8057 19.4592C16.3634 18.9696 16.1423 18.32 16.1423 17.5105H17.8541C17.8541 17.9804 17.9646 18.3418 18.1858 18.5945C18.4108 18.8432 18.7327 18.9676 19.1512 18.9676C19.4987 18.9676 19.7731 18.8768 19.9745 18.6952C20.1759 18.5096 20.2766 18.2608 20.2766 17.9489Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
            <TabCoinIcon className="text-pink-200 h-16" />
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
          <FiMessageSquare size={22} className="mb-1" stroke-width="1.5" />
          <span className="text-sm">123</span>
        </button>
        <button type="button" className="flex flex-col items-center">
          <TabCoinIcon className="mb-1 h-6" />
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
