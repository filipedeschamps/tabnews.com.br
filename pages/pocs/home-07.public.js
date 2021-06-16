import Link from "next/link";
import { CgTab } from "react-icons/cg";
import { IoChatbox } from "react-icons/io5";
import { BsArrowReturnRight } from "react-icons/bs";
import { VscCircleFilled } from "react-icons/vsc";
import newsItems from "./dataset.json";

export default function Home() {
  return (
    <div>
      <header className="container pl-3 pr-3 m-auto">
        <nav className="flex items-center justify-between pt-3 pb-3 mb-3 border-b-2 border-gray-200">
          <div className="flex items-center space-x-1 text-gray-800">
            <CgTab className="w-5 h-5" />
            <span className="text-sm font-medium">TabNews</span>
          </div>
        </nav>
      </header>

      <div className="container pl-3 pr-3 m-auto">
        <NewsList />
      </div>
    </div>
  );
}

function NewsList() {
  return (
    <div className="flex flex-col space-y-3">
      {newsItems.map((news, index) => {
        return (
          <div className="flex font-sans" key={index}>
            <Link href="#">
              <a className="flex flex-col items-center self-start mt-1 mr-2 ">
                <div
                  className={`w-12 pt-1 pb-1 text-sm font-bold text-center border rounded-lg rounded-b-none
                  ${index === 0 ? "border-yellow-300" : ""}
                  ${index === 1 ? "border-gray-400" : ""}
                  ${index === 2 ? "border-yellow-600" : ""}
                  ${index >= 3 ? "border-gray-200" : ""}`}
                >
                  {index + 1}
                </div>
                <div
                  className={`w-full pb-1 text-xs text-center pt-0.5 rounded-lg rounded-t-none
                  ${index === 0 ? "bg-yellow-300" : ""}
                  ${index === 1 ? "bg-gray-400" : ""}
                  ${index === 2 ? "bg-yellow-600" : ""}
                  ${index >= 3 ? "bg-gray-200" : ""}
                  `}
                >
                  {news.coins}
                </div>
              </a>
            </Link>
            <div className="flex-1 overflow-hidden">
              <div className="text-base font-semibold text-gray-900">
                {news.title}
              </div>
              <div className="text-xs leading-loose text-gray-400 truncate">
                {news.comments} comentários | {news.date} | {news.author}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {news.comment && `Comentário destaque: "${news.comment}"`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

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
              <div className="flex items-center flex-shrink-0 overflow-hidden text-xs font-normal text-gray-400">
                <div className="flex-shrink-0 overflow-hidden flex-nowrap">
                  {news.date} | {username()} |
                </div>
                <div className="flex flex-shrink-0 ml-1 space-x-5 overflow-hidden flex-nowrap">
                  <div>
                    {news.coins * Math.random()
                      ? Math.round(news.coins * Math.random())
                      : "854"}
                    {" comentários: "}{" "}
                    <span className="italic">
                      "{lorem.generateSentences(2)}"
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex overflow-hidden text-xs font-normal text-gray-400">
                <div className="inline-flex items-center flex-shrink-0"></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
