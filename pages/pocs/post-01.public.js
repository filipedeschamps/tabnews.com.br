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

export default function Home() {
  return (
    <div className="pl-3 pr-3">
      <header className="m-auto max-w-7xl">
        <nav className="flex items-center justify-between pt-2 pb-2 mb-3 border-b-2 border-gray-200">
          <div className="flex items-center space-x-1 text-gray-800">
            <CgTab className="w-5 h-5" />
            <span className="text-sm font-medium">TabNews</span>
          </div>
          <div className="flex space-x-2">
            <div className="flex items-center pt-1 pb-1 pl-2 pr-2 font-mono text-sm text-gray-500 border border-gray-300 rounded-lg">
              <MdMonetizationOn className="w-4 h-4 mr-1 text-yellow-400" /> 0052
            </div>
            <div className="flex items-center pt-1 pb-1 pl-2 pr-2 font-mono text-sm text-gray-500 border border-gray-300 rounded-lg">
              <MdAccountCircle className="w-4 h-4 mr-1 text-blue-500" /> 1430
            </div>
          </div>
        </nav>
      </header>

      <div className="container m-auto mt-8">
        <Post />
      </div>
    </div>
  );
}

function Post() {
  return (
    <div className="max-w-4xl m-auto">
      <div className="flex font-sans">
        <Link href="#">
          <a className="flex flex-col items-center self-start mt-1 mr-2 ">
            <div className="w-12 pt-1 pb-1 text-sm font-bold text-center border border-gray-300 rounded-lg rounded-b-none">
              <MdMonetizationOn className="inline-block w-4 h-4 text-yellow-400 " />
            </div>
            <div className="w-full pb-1 text-xs text-center pt-0.5 rounded-lg rounded-t-none bg-gray-300 text-gray-700">
              132
            </div>
          </a>
        </Link>
        <div className="flex-1 overflow-hidden">
          <h1 className="text-3xl font-semibold text-gray-900">
            WhatsApp volta atrás e não vai mais desativar contas que não
            aceitarem nova política de privacidade
          </h1>
          <div className="text-xs text-gray-400 truncate">
            <span className="font-semibold">gustavodeschamps</span> | 45 minutos
            atrás
          </div>

          <p className="mt-4 text-gray-700">
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

      <div className="flex items-center mt-2 text-xs font-semibold text-gray-700 ml-14">
        <IoChatbox className="w-4 h-4 mr-1 text-yellow-400" /> Comentar
      </div>

      <hr className="mt-8 mb-8 border-t-2 border-gray-200 border-dotted ml-14" />

      <div className="flex font-sans">
        <Link href="#">
          <a className="flex flex-col items-center self-start mr-2 ">
            <div className="w-12 pt-1 pb-1 text-sm font-bold text-center border border-gray-300 rounded-lg rounded-b-none">
              <MdMonetizationOn className="inline-block w-4 h-4 text-yellow-400" />
            </div>
            <div className="w-full pb-1 text-xs text-center pt-0.5 rounded-lg rounded-t-none bg-gray-300 text-gray-700">
              15
            </div>
          </a>
        </Link>
        <div className="flex-1 overflow-hidden">
          <div className="text-xs text-gray-400 truncate">
            <span className="font-semibold">filipedeschamps</span> | 45 minutos
            atrás
          </div>

          <p className="text-gray-700">
            O que eu fico feliz com toda essa história é que quem está tocando
            essas mudanças dentro do Facebook não poderia esperar uma rejeição
            tão grande. Eu acho isso ótimo, mas sinceramente depois dos últimos
            anúncios acho que eles não estão nem aí. Para piorar, recentemente
            na Newsletter saiu que o crescimento do WhatsApp voltou a ser maior
            do que todos os outros aplicativos de mensageria.
          </p>

          <div className="flex items-center mt-2 text-xs font-semibold text-gray-700">
            <IoChatbox className="w-4 h-4 mr-1 text-yellow-400" /> Comentar
          </div>
        </div>
      </div>

      <hr className="mt-8 mb-8 border-t-2 border-gray-200 border-dotted ml-14" />

      <div className="flex font-sans">
        <Link href="#">
          <a className="flex flex-col items-center self-start mr-2 ">
            <div className="w-12 pt-1 pb-1 text-sm font-bold text-center border border-gray-300 rounded-lg rounded-b-none">
              <MdMonetizationOn className="inline-block w-4 h-4 text-yellow-400" />
            </div>
            <div className="w-full pb-1 text-xs text-center pt-0.5 rounded-lg rounded-t-none bg-gray-300 text-gray-700">
              1
            </div>
          </a>
        </Link>
        <div className="flex-1 overflow-hidden">
          <div className="text-xs text-gray-400 truncate">
            <span className="font-semibold">arenata</span> | 1 hora atrás
          </div>

          <p className="text-gray-700">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>

          <p className="mt-6 text-gray-700">
            Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
            cupidatat non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum.
          </p>

          <div className="flex items-center mt-2 text-xs font-semibold text-gray-700">
            <IoChatbox className="w-4 h-4 mr-1 text-yellow-400" /> Comentar
          </div>
        </div>
      </div>
    </div>
  );
}
