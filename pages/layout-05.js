import Link from "next/link";
import { CgTab } from "react-icons/cg";
import { IoChatbox } from "react-icons/io5";
import { VscCircleFilled } from "react-icons/vsc";

export default function Home() {
  return (
    <>
      <header className="container pl-3 pr-3 m-auto">
        <nav className="flex items-center justify-between pt-3 pb-3 mb-4 border-b-2 border-gray-200">
          <div className="flex items-center space-x-1">
            <CgTab className="w-5 h-5 text-gray-800" />
            <span className="text-sm font-medium">TabNews</span>
          </div>
        </nav>
      </header>

      <div className="container pl-3 pr-3 m-auto">
        <NewsList />
      </div>
    </>
  );
}

function NewsList() {
  const newsItems = [
    {
      coins: "1.1k",
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
    {
      coins: "1.1k",
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

  return (
    <div className="flex flex-col space-y-5">
      {newsItems.map((news, index) => {
        return (
          <div className="flex items-start" key={index}>
            <div className="w-10 pt-2 pb-2 mt-1 mr-2 text-xs leading-relaxed text-center bg-yellow-300 rounded-lg">
              {news.coins}
            </div>
            <div className="flex-1">
              <div className="text-base font-medium text-gray-800">
                <Link href="#">
                  <a>{news.title}</a>
                </Link>
              </div>
              {/* Fazer o ellipis ou truncate funcionar */}
              <div className="flex overflow-hidden text-xs font-normal text-gray-400">
                <div className="inline-flex items-center flex-shrink-0">
                  <IoChatbox className="mr-0.5" />
                  {news.coins * Math.random()
                    ? Math.round(news.coins * Math.random())
                    : "854"}{" "}
                  comentários
                </div>
                <div className="flex-shrink-0 ml-1">
                  | {news.date} | {news.author}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
