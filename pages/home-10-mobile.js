import Link from "next/link";
import { CgTab } from "react-icons/cg";
import { IoChatbox } from "react-icons/io5";
import { BiSearch } from "react-icons/bi";
import { MdAccountCircle } from "react-icons/md";
import { MdMonetizationOn } from "react-icons/md";
import newsItems from '../db/news.json';

export default function Home() {
  return (
    <div className="flex flex-col">
      <header className="flex flex-col fixed w-full bg-white items-center border-b border-gray-200 bg-gray-50">
        <nav className="flex w-full max-w-5xl space-x-2 justify-between py-2 px-5 md:px-10 ">

          <div className="flex items-center space-x-1 text-gray-800">
            <CgTab className="w-6 h-6" />
            <span className="text-md font-medium hidden md:block ">TabNews</span>
          </div>


            <form className="flex text-gray-800">
              <input className=" appearance-none border rounded-l w-24 md:w-60  py-1 px-2 text-gray-700  focus:outline-none focus:shadow-outline " type="text" />
              <div className="flex items-center pt-1 pb-1 pl-3 pr-3 font-mono text-sm text-gray-500 border border-gray-300 rounded-r bg-gray-100">
                <BiSearch className="w-4 h-5  text-black-400" />
              </div>
            </form>
          
          <div className="flex space-x-2">
            <div className="flex items-center pt-1 pb-1 pl-2 pr-2 font-mono text-sm text-gray-500 border border-gray-300 rounded-lg bg-gray-100">
              <MdMonetizationOn className="w-4 h-4 mr-1 text-yellow-400" /> 0052
            </div>

            <div className="flex items-center pt-1 pb-1 pl-2 pr-2 font-mono text-sm text-gray-500 border border-gray-300 rounded-lg bg-gray-100">
              <MdAccountCircle className="w-4 h-4 mr-1 text-blue-500" /> 1430
            </div>
          </div>

        </nav>
      </header>

      <div className="mt-12 md:mt-14">
        {newsItems.map(({ title, comment, coins, date, author, comments }, index) => (
          <Post
            key={index}
            title={title}
            comment={comment}
            coins={coins}
            date={date}
            author={author}
            comments={comments}
          />
        ))}
      </div>
    </div>
  );
}

const Post = ({ coins, title, comment, date, author, comments }) => {
  return (
    <div className="max-w-5xl m-auto flex flex-col mt-5 px-4 md:px-4 lg:px-0">
      <div className="font-sans flex flex-row  px-5 md:px-10 lg:px-10 py-5 md:py-10 lg:py-10 rounded-lg border border-gray-300 bg-gray-100">
        <Link href="#">
          <a className="flex flex-col items-center mt-1 mr-5 md:mr-10 lg:mr-10 hidden md:block">
            <div className="w-12 pt-1 pb-1 text-sm font-bold text-center border border-gray-300 rounded-lg rounded-b-none">
              <MdMonetizationOn className="inline-block w-4 h-4 text-yellow-400 " />
            </div>
            <div className="w-full pb-1 text-xs text-center pt-0.5 rounded-lg rounded-t-none bg-gray-300 text-gray-700">
              {coins}
            </div>
          </a>
        </Link>
        <div className="flex-1 overflow-hidden">
          <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
          <div className="text-xs text-gray-400 truncate mt-2">
            <span className="font-semibold">{author}</span> | {date}
          </div>
          
            <p className="mt-4 text-gray-700">{comment}</p>
            <div className="flex items-center justify-between mt-5 md:mt-10">
            <div className="flex items-center  text-xs font-semibold text-gray-700 cursor-pointer">
              <IoChatbox className="w-4 h-4 mr-1 text-yellow-400" /> Ver todos os {comments} comentários
            </div>
            <Link href="#">
            <a className="flex flex-col items-center  md:mr-10 lg:mr-20 block md:hidden">
              <div className="w-12 pt-1 pb-1 text-sm font-bold text-center border border-gray-300 rounded-lg rounded-b-none">
                <MdMonetizationOn className="inline-block w-4 h-4 text-yellow-400 " />
              </div>
              <div className="w-12 pb-1 text-xs text-center pt-0.5 rounded-lg rounded-t-none bg-gray-300 text-gray-700">
                {coins}
              </div>
            </a>
          </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
