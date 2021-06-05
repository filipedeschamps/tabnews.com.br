import ThemeModeProvider from '../poc/home-09/hooks/themeModeProvider'
import { CgTab } from "react-icons/cg";
import { MdAccountCircle } from "react-icons/md";
import { MdMonetizationOn } from "react-icons/md";
import Link from "next/link";
import { FaStar } from "react-icons/fa";
import { LoremIpsum } from "lorem-ipsum";
import { newsItems } from '../poc/home-09/utils/newsData'
import {useTheme} from '../poc/home-09/hooks/themeModeProvider'

export function ToggleButton() {
  const {isDarkModeOn, handleDarkModeChange} = useTheme()

  return (
    <button className="border border-gray-300 dark:border-darkTheme-secondary text-gray-700 focus:outline-none px-4 rounded-lg dark:text-darkTheme-primary" type="button" onClick={()=>{handleDarkModeChange()}}>
      {isDarkModeOn ? "Desligar Dark Mode" : "Ligar Dark Mode"}
    </button>
  );
}

export function Header() {
  return (
    <header className="m-auto">
      <nav className="flex items-center justify-between pt-2 pb-2 mb-3 border-b border-gray-200 dark:border-darkTheme-secondary">
        <div className="flex items-center space-x-1 text-gray-800">
          <CgTab className="w-7 h-7 dark:text-darkTheme-primary" />
          <span className="text-md font-medium dark:text-darkTheme-primary">TabNews</span>
        </div>
        <div className="flex space-x-2">
          <ToggleButton/>
          <div className="flex items-center pt-1 pb-1 pl-2 pr-2 font-mono text-lg text-gray-500 border border-gray-300 rounded-lg dark:text-darkTheme-primary dark:border-darkTheme-secondary">
            <MdMonetizationOn className="w-6 h-6 mr-1 text-yellow-400 dark:text-darkTheme-yellow-400" /> 0052
            </div>
          <div className="flex items-center pt-1 pb-1 pl-2 pr-2 font-mono text-lg text-gray-500 border border-gray-300 rounded-lg dark:border-darkTheme-secondary dark:text-darkTheme-primary">
            <MdAccountCircle className="w-6 h-6  mr-1 text-blue-500 dark:text-darkTheme-green-200" /> 1430
            </div>
        </div>
      </nav>
    </header>
  );
}

export function NewsList() {

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
    <div className="flex flex-col space-y-5">
      {newsItems.map((news, index) => {
        function getCommentsCount(news) {
          return Math.round(news.coins * 0.2);
        }

        return (
          <div className="flex font-sans items-center justify-center" key={index}>
            <Link href="#">
              <a className="flex flex-col items-center self-start mt-1 mr-2">
                <div
                  className={`w-16 pt-1 pb-1 text-md font-bold text-center border rounded-lg rounded-b-none
                  ${
                    index === 0
                      ? "border-yellow-300 text-gray-900 dark:text-darkTheme-yellow-400 dark:border-darkTheme-yellow-400"
                      : "border-gray-300 text-gray-700 dark:text-darkTheme-primary dark:border-darkTheme-primary"
                    }
                  `}
                >
                  {index + 1}
                </div>
                <div
                  className={`w-full pb-1 text-sm font-medium text-center pt-0.5 rounded-lg rounded-t-none
                  ${
                    index === 0
                      ? "bg-yellow-300 text-yellow-900 dark:text-darkTheme-background dark:bg-darkTheme-yellow-400"
                      : "bg-gray-300 text-gray-700 dark:text-darkTheme-background dark:bg-darkTheme-primary"
                    }
                  `}
                >
                  {news.coins}
                </div>
              </a>
            </Link>
            <div className="flex-1 overflow-hidden">
              <Link href="/post-01">
                <a className={`inline-block text-base text-lg font-semibold leading-snug text-gray-900 ${
                    index === 0
                      ? "dark:text-darkTheme-yellow-400"
                      : "dark:text-darkTheme-primary"
                    }
                  `}>
                  {news.title}
                </a>
              </Link>
              
              <div className="text-md tracking-tight text-gray-400 dark:text-darkTheme-yellow-200">
                {news.comment && (
                  <div className="flex items-center">
                    <FaStar className="w-3 h-3 mr-0.5 text-yellow-400 dark:text-darkTheme-yellow-200" />
                    <div className="flex-1 truncate">
                      Comentário destaque: "{news.comment}"
                    </div>
                  </div>
                )}

                {/* Comentário destaque: <span>"{lorem.generateSentences(2)}"</span> */}
              </div>
              <div className="text-sm tracking-tight text-gray-400 truncate dark:text-darkTheme-secondary">
                {/* <IoChatbox className="w-3 h-3 mr-0.5 inline-block" /> */}
                {getCommentsCount(news)} comentários | {news.date} |{" "}
                {news.author}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


export default function Home() {
  return (
    <ThemeModeProvider>
      <div className="transition-colors duration-500 dark:bg-darkTheme-background">
        <div className="pl-3 pr-3 max-w-5xl m-auto">
          <Header />
          <div className="m-auto">
            <NewsList />
          </div>
        </div>
      </div>
    </ThemeModeProvider>
  );
}