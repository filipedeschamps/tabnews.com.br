import Link from "next/link";
import { CgTab } from "react-icons/cg";
import { IoChatbox } from "react-icons/io5";
import { BsArrowReturnRight } from "react-icons/bs";
import { VscCircleFilled } from "react-icons/vsc";
import newsItems from "./dataset.json";

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
                  {news.date} | {news.author} |
                </div>
                <div className="flex flex-shrink-0 ml-1 space-x-5 overflow-hidden flex-nowrap">
                  <div>
                    {news.comments}
                    {" comentários: "}{" "}
                    <span className="italic">{news.comment}</span>
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
