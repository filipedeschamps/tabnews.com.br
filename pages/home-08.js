import Link from "next/link";
import { CgTab } from "react-icons/cg";
import { IoChatbox } from "react-icons/io5";
import { BsArrowReturnRight } from "react-icons/bs";
import { FaStar } from "react-icons/fa";
import { VscCircleFilled } from "react-icons/vsc";
import { MdStars } from "react-icons/md";
import { MdAccountCircle } from "react-icons/md";
import { MdMonetizationOn } from "react-icons/md";
import { RiMoneyDollarCircleFill } from "react-icons/ri";

import { username } from "react-lorem-ipsum";
import { LoremIpsum } from "lorem-ipsum";

export default function Home() {
  return (
    <div>
      <header className="pl-3 pr-3 m-auto max-w-7xl">
        <nav className="flex items-center justify-between pt-2 pb-2 mb-3 border-b-2 border-gray-200">
          <div className="flex items-center space-x-1 text-gray-800">
            <CgTab className="w-5 h-5" />
            <span className="text-sm font-medium">TabNews</span>
          </div>
          <div className="flex space-x-2">
            <div className="flex items-center pt-1 pb-1 pl-2 pr-2 font-mono text-sm text-yellow-900 bg-yellow-400 rounded-lg">
              <MdMonetizationOn className="w-4 h-4 mr-1" /> 0052
            </div>
            <div className="flex items-center pt-1 pb-1 pl-2 pr-2 font-mono text-sm text-blue-900 bg-blue-400 rounded-lg">
              <MdAccountCircle className="w-4 h-4 mr-1" /> 1430
            </div>
          </div>
        </nav>
      </header>

      <div className="pl-3 pr-3 m-auto max-w-7xl">
        <NewsList />
      </div>
    </div>
  );
}

function NewsList() {
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

  const lorem = new LoremIpsum({
    sentencesPerParagraph: {
      max: 8,
      min: 4,
    },
    wordsPerSentence: {
      max: 16,
      min: 4,
    },
  });

  return (
    <div className="flex flex-col space-y-3">
      {newsItems.map((news, index) => {
        function getCommentsCount(news) {
          return Math.round(news.coins * 0.2);
        }

        return (
          <div className="flex font-sans" key={index}>
            <Link href="#">
              <a className="flex flex-col items-center self-start mt-1 mr-2 ">
                <div
                  className={`w-12 pt-1 pb-1 text-sm font-bold text-center border rounded-lg rounded-b-none
                  ${
                    index === 0
                      ? "border-yellow-300 text-gray-900"
                      : "border-gray-300 text-gray-700"
                  }
                  `}
                >
                  {index + 1}
                </div>
                <div
                  className={`w-full pb-1 text-xs text-center pt-0.5 rounded-lg rounded-t-none
                  ${
                    index === 0
                      ? "bg-yellow-300 text-yellow-900"
                      : "bg-gray-300 text-gray-700"
                  }
                  `}
                >
                  {news.coins}
                </div>
              </a>
            </Link>
            <div className="flex-1 overflow-hidden">
              <Link href="/post-01">
                <a className="inline-block text-base font-semibold leading-snug text-gray-900">
                  {news.title}
                </a>
              </Link>
              <div className="text-xs tracking-tight text-gray-400 truncate">
                {/* <IoChatbox className="w-3 h-3 mr-0.5 inline-block" /> */}
                {getCommentsCount(news)} comentários | {news.date} |{" "}
                {news.author}
              </div>
              <div className="text-xs tracking-tight text-gray-400 ">
                {news.comment && (
                  <div className="flex items-center">
                    <FaStar className="w-3 h-3 mr-0.5 text-yellow-400" />
                    <div className="flex-1 truncate">
                      Comentário destaque: "{news.comment}"
                    </div>
                  </div>
                )}

                {/* Comentário destaque: <span>"{lorem.generateSentences(2)}"</span> */}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
