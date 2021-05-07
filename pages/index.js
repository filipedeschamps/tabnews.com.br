import Link from "next/link";
import { CgTab } from "react-icons/cg";
import { RiMoneyDollarCircleFill } from "react-icons/ri";

function NewsList() {
  const newsItems = [
    {
      coins: "1.534",
      autor: "gustavodeschamps",
      title: "STF teria sofrido ataque hacker",
      date: "45 minutos atrás",
    },
    {
      coins: "950",
      autor: "filipedeschamps",
      title:
        "WhatsApp volta atrás e não vai mais desativar contas que não aceitarem nova política de privacidade",
      date: "2 horas atrás",
    },
    {
      coins: "500",
      autor: "arenata",
      title:
        "Reações nucleares estão sendo reativadas novamente em Chernobyl, 35 anos após acidente",
      date: "1 minuto atrás",
    },
    {
      coins: "160",
      autor: "gustavodeschamps",
      title: "Alerta para golpe do WhatsApp voltado ao Dia das Mães",
      date: "4 horas atrás",
    },
    {
      coins: "5",
      autor: "gustavodeschamps",
      title:
        "Supermercado na Polônia vai testar IA para reduzir desperdício de alimentos",
      date: "40 minutos atrás",
    },
    {
      coins: "201",
      autor: "gustavodeschamps",
      title:
        "Programa que conserta e doa computadores já entregou mais de 20 mil equipamentos",
      date: "5 horas atrás",
    },
    {
      coins: "83",
      autor: "gustavodeschamps",
      title:
        "Software pirata leva a ataque ransomware em instituto europeu de pesquisa biomolecular",
      date: "12 horas atrás",
    },
    {
      coins: "340",
      autor: "gustavodeschamps",
      title: "Nova Iorque pode banir mineração de moedas digitais",
      date: "13 horas atrás",
    },
    {
      coins: "500",
      autor: "gustavodeschamps",
      title:
        "Starlink ameaça cortar internet de usuário após download ilegal de série de TV",
      date: "15 horas atrás",
    },
  ];

  return (
    <div className="flex flex-col m-2 space-y-2">
      {newsItems.map((news, index) => {
        return (
          <Link href="#" key={index}>
            <a className="flex flex-col p-4 space-y-1 bg-white rounded-md shadow-sm">
              <div className="text-sm font-medium text-gray-700">
                {news.title}
              </div>
              <div className="flex items-center text-xs font-normal text-gray-400">
                <div className="flex items-center mr-1 font-semibold">
                  <RiMoneyDollarCircleFill className="w-3 h-3 mr-0.5" />
                  {news.coins}
                </div>
                <div>há {news.date}</div>
              </div>
            </a>
          </Link>
        );
      })}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <header className="border-b-2 border-gray-200">
        <nav className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-1">
            <CgTab className="w-5 h-5 text-gray-700" />
            <span className="text-sm font-medium">TabNews</span>
          </div>
          {/* <div className="flex items-center space-x-1">
            <Link href="#">
              <a className="p-2 text-sm ">Login</a>
            </Link>
            <Link href="#">
              <a className="px-2 py-1 text-sm font-medium border border-gray-200 rounded-sm hover:border-gray-250 hover:bg-gray-50">
                Cadastro
              </a>
            </Link>
          </div> */}
        </nav>
      </header>
      <div className="flex m-2">
        <div className="bg-gray-100 rounded-md w-96">
          <NewsList />
        </div>
        <div className=""></div>
      </div>
    </>
  );
}
