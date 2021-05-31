import Link from "next/link";
import { FaStar } from "react-icons/fa";

import { LoremIpsum } from "lorem-ipsum";
import { newsItems } from '../utils/newsData'

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
