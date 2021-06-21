import Link from "next/link";
import { CgTab } from "react-icons/cg";
import { AiOutlineComment } from "react-icons/ai";
import { BsArrowReturnRight } from "react-icons/bs";
import { FaStar } from "react-icons/fa";
import { VscCircleFilled } from "react-icons/vsc";
import { MdStars } from "react-icons/md";
import { MdAccountCircle } from "react-icons/md";
import { MdMonetizationOn } from "react-icons/md";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { AiFillFire } from "react-icons/ai";
import PillCoin from "../home-11/components/PillCoin";
import { GiRank3, GiRank1 } from "react-icons/gi";

import ThemeModeProvider from "../home-11/hooks/useTheme";
import Header from "../home-11/components/Header";

import NewsList from "../home-11/components/NewsList";
import DataProvider from "../home-11/hooks/useData";

export function PillPosition({ index, isPost = false }) {
  return (
    <div
      className={`flex w-80 px-2 pr-6 pt-1 pb-1 font-semibold text-center
        ${
          index === 0 && !isPost
            ? "hidden"
            : "text-3xl text-transparent bg-clip-text bg-lightTheme-Primary dark:text-darkTheme-primary dark:border-darkTheme-primary"
        }
      `}
      style={{ height: "fit-content" }}
    >
      {isPost && `Posição ${index}`}
      {!isPost && index + 1}
    </div>
  );
}

export default function Home() {
  return (
    <ThemeModeProvider>
      <DataProvider>
        <div
          style={{ minHeight: "100vh" }}
          className="bg-gradient-to-r from-lightTheme-background-primary to-lightTheme-background-secondary transition-colors duration-500 bg-lightTheme-background dark:bg-darkTheme-background"
        >
          <div className="pl-3 pr-3 max-w-5xl m-auto">
            <Header />
            <div className="m-auto z-50 pb-8">
              <Post />
            </div>
          </div>
        </div>
      </DataProvider>
    </ThemeModeProvider>
  );
}

function Post() {
  return (
    <div className="relative w-full rounded-lg flex flex-col items-center justify-between dark:border-darkTheme-secondary">
      <div className="relative w-full pb-6 rounded-lg flex flex-col items-start justify-between shadow-2xl dark:border-darkTheme-secondary">
        <div
          className="absolute w-full rounded-lg z-0 top-0 left-0 bg-lightTheme-primary opacity-40"
          style={{ width: "100%", height: "100%" }}
        />
        <div className="w-full z-10 flex font-sans items-center justify-between rounded-lg">
          <div className="w-full z-10 flex flex-col items-center justify-between">
            <div className="w-full flex items-start justify-between">
              <Link href="/post-01">
                <a
                  className={`p-4 flex-1 text-2xl py-2 inline-block text-base font-semibold leading-snug text-lightTheme-secondary z-50`}
                >
                  WhatsApp volta atrás e não vai mais desativar contas que não
                  aceitarem nova política de privacidade
                </a>
              </Link>

              <div className="min-w-max	z-50 text-sm font-semibold w-min tracking-tight text-lightTheme-secondary shadow-md bg-gradient-to-r from-lightTheme-background-primary to-lightTheme-background-secondary py-2 px-4 rounded-lg rounded-tl-none rounded-br-none truncate dark:text-darkTheme-secondary">
                gustavodeschamps | 45 minutos
              </div>
            </div>
            <div className="py-8 px-4 pt-0">
              <p className="text-gray-700">
                O mensageiro, no entanto, continuará a mostrar lembretes até a
                aceitação dos novos termos de uso. Segundo a empresa, a grande
                maioria das pessoas já aceitou a atualização das políticas de
                privacidade e compartilhamento de dados com o Facebook.
              </p>
              <p className="mt-4 text-gray-700">
                As informações são do site TheNextWeb.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between w-full">
          <div className="flex items-center shadow-md justify-start ml-4 p-2 rounded-lg font-regular z-10 bg-gray-100">
            <AiOutlineComment
              size={20}
              className="mr-1 text-lightTheme-background-third"
            />
            <div className="text-md text-lightTheme-background-third">
              Comentar
            </div>
          </div>
          <div className="flex items-center justify-center z-50 pr-4">
            <div className="flex items-center justify-center z-50 pr-8">
              <svg width="0" height="0">
                <linearGradient
                  id="blue-gradient"
                  x1="100%"
                  y1="100%"
                  x2="0%"
                  y2="0%"
                >
                  <stop stopColor="#5ebdae" offset="0%" />
                  <stop stopColor="#36689e" offset="100%" />
                </linearGradient>
              </svg>
              <GiRank3 size={30} style={{ fill: "url(#blue-gradient)" }} />
              <PillCoin newsCoin={3} />
            </div>
            <svg width="0" height="0">
              <linearGradient
                id="red-gradient"
                x1="100%"
                y1="100%"
                x2="0%"
                y2="0%"
              >
                <stop stopColor="#EF4444" offset="0%" />
                <stop stopColor="#FBBF24" offset="100%" />
              </linearGradient>
            </svg>
            <AiFillFire size={25} style={{ fill: "url(#red-gradient)" }} />
            <PillCoin newsCoin={1234} />
          </div>
        </div>

        <hr className="z-50 mt-8 mb-8 border-t-1 border-gray-300 w-11/12 self-center" />

        <div className="flex flex-col font-sans z-10">
          <div className="flex pr-5 pb-2 justify-end text-xs text-gray-800 w-full">
            <span className="font-semibold">filipedeschamps</span> | 45 minutos
            atrás
          </div>
          <div className="flex p-4 font-sans z-10 bg-gray-100 mx-4 rounded-lg">
            <div className="flex-1">
              <p className="text-gray-700">
                O que eu fico feliz com toda essa história é que quem está
                tocando essas mudanças dentro do Facebook não poderia esperar
                uma rejeição tão grande. Eu acho isso ótimo, mas sinceramente
                depois dos últimos anúncios acho que eles não estão nem aí. Para
                piorar, recentemente na Newsletter saiu que o crescimento do
                WhatsApp voltou a ser maior do que todos os outros aplicativos
                de mensageria.
              </p>

              <div className="flex items-center justify-between w-full mt-8">
                <div className="flex border-2 border-gray-50 items-center shadow-lg justify-start p-2 rounded-lg font-regular z-10 bg-gray-100">
                  <AiOutlineComment
                    size={20}
                    className="mr-1 text-lightTheme-background-third"
                  />
                  <div className="text-md text-lightTheme-background-third">
                    Comentar
                  </div>
                </div>
                <div className="flex items-center justify-center z-50">
                  <div className="flex items-center justify-center z-50 pr-8">
                    <svg width="0" height="0">
                      <linearGradient
                        id="blue-gradient"
                        x1="100%"
                        y1="100%"
                        x2="0%"
                        y2="0%"
                      >
                        <stop stopColor="#5ebdae" offset="0%" />
                        <stop stopColor="#36689e" offset="100%" />
                      </linearGradient>
                    </svg>
                    <GiRank1
                      size={30}
                      style={{ fill: "url(#blue-gradient)" }}
                    />
                    <PillCoin newsCoin={1} />
                  </div>
                  <svg width="0" height="0">
                    <linearGradient
                      id="black-gradient"
                      x1="100%"
                      y1="100%"
                      x2="0%"
                      y2="0%"
                    >
                      <stop stopColor="#121212" offset="0%" />
                      <stop stopColor="#ccd8e0" offset="100%" />
                    </linearGradient>
                  </svg>
                  <AiFillFire
                    size={25}
                    style={{ fill: "url(#black-gradient)" }}
                  />
                  <PillCoin newsCoin={123} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="z-50 mt-8 mb-8 border-t-1 border-gray-300 w-11/12 self-center" />

        <div className="flex flex-col font-sans z-10">
          <div className="flex pr-5 pb-2 justify-end text-xs text-gray-800 w-full">
            <span className="font-semibold">filipedeschamps</span> | 45 minutos
            atrás
          </div>
          <div className="flex p-4 font-sans z-10 bg-gray-100 mx-4 rounded-lg">
            <div className="flex-1">
              <p className="text-gray-700">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
              </p>

              <div className="flex items-center justify-between w-full mt-8">
                <div className="flex border-2 border-gray-50 items-center shadow-lg justify-start p-2 rounded-lg font-regular z-10 bg-gray-100">
                  <AiOutlineComment
                    size={20}
                    className="mr-1 text-lightTheme-background-third"
                  />
                  <div className="text-md text-lightTheme-background-third">
                    Comentar
                  </div>
                </div>
                <div className="flex items-center justify-center z-50">
                  <div className="flex items-center justify-center z-50 pr-8">
                    <svg width="0" height="0">
                      <linearGradient
                        id="blue-gradient"
                        x1="100%"
                        y1="100%"
                        x2="0%"
                        y2="0%"
                      >
                        <stop stopColor="#5ebdae" offset="0%" />
                        <stop stopColor="#36689e" offset="100%" />
                      </linearGradient>
                    </svg>
                    <GiRank1
                      size={30}
                      style={{ fill: "url(#blue-gradient)" }}
                    />
                    <PillCoin newsCoin={1} />
                  </div>
                  <svg width="0" height="0">
                    <linearGradient
                      id="black-gradient"
                      x1="100%"
                      y1="100%"
                      x2="0%"
                      y2="0%"
                    >
                      <stop stopColor="#121212" offset="0%" />
                      <stop stopColor="#ccd8e0" offset="100%" />
                    </linearGradient>
                  </svg>
                  <AiFillFire
                    size={25}
                    style={{ fill: "url(#black-gradient)" }}
                  />
                  <PillCoin newsCoin={123} />
                </div>
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
}
