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
import newsItems from "./dataset.json";

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

      <div className="m-auto max-w-7xl">
        <NewsList />
      </div>
    </div>
  );
}

function NewsList() {
  return (
    <div className="flex flex-col space-y-4">
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
