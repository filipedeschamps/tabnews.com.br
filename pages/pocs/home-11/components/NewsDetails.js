import Link from "next/link";
import { AiFillFire } from "react-icons/ai";
import { useData } from '../hooks/useData';
import PillCoin from './PillCoin';
import NewsMainComment from './NewsMainComment'

export default function NewsDetails({ newsAuthor, newsDate, newsTitle, index, news }) {

  function getCommentsCount(news) {
    return Math.round(news.coins * 0.2);
  }

  return (
    <div className="relative w-full rounded-lg flex flex-col items-center justify-between dark:border-darkTheme-secondary" >
      <div className="relative w-full rounded-lg flex flex-col items-start justify-between shadow-xl dark:border-darkTheme-secondary" >
        {!index && <div className="absolute w-full rounded-lg z-1 top-0 left-0 bg-gradient-to-r from-red-100 via-yellow-100 to-yellow-200 opacity-80" style={{ width: "100%", height: "100%" }} />}
        {!!index && <div className="absolute w-full rounded-lg z-0 top-0 left-0 bg-lightTheme-primary opacity-40" style={{ width: "100%", height: "100%" }} />}
        <div className="px-4 pr-0 w-full flex items-start justify-between">
          <Link href="/pocs/post-02">
            <a className={`py-2 mb-2 inline-block text-base font-semibold leading-snug text-lightTheme-secondary z-50 ${
              index === 0
                ? "text-2xl dark:text-darkTheme-yellow-400"
                : "text-lg dark:text-darkTheme-primary"
              }
                    `}>
              {newsTitle}
            </a>
          </Link>
          {news.comment && !index &&
            <div className="z-50 text-sm font-semibold w-min tracking-tight text-lightTheme-secondary bg-gradient-to-r from-yellow-100 via-yellow-100 to-red-100 shadow-sm py-2 px-4 rounded-lg rounded-tl-none rounded-br-none truncate dark:text-darkTheme-secondary">
              {getCommentsCount(news)} comentários | {newsDate} |{" "}
              {newsAuthor}
            </div>
          }
          {news.comment && !!index &&
            <div className="z-50 text-sm font-semibold w-min tracking-tight text-lightTheme-secondary shadow-md bg-gradient-to-r from-lightTheme-background-primary to-lightTheme-background-secondary py-2 px-4 rounded-lg rounded-tl-none rounded-br-none truncate dark:text-darkTheme-secondary">
              {getCommentsCount(news)} comentários | {newsDate} |{" "}
              {newsAuthor}
            </div>
          }
          {!news.comment &&
            <div className="flex flex-col justify-between items-end">
              <div className="z-50 text-sm font-semibold w-min tracking-tight shadow-md text-lightTheme-secondary bg-gradient-to-r from-lightTheme-background-primary to-lightTheme-background-secondary py-2 px-4 rounded-lg rounded-tl-none rounded-br-none truncate dark:text-darkTheme-secondary">
                {getCommentsCount(news)} comentários | {newsDate} |{" "}
                {newsAuthor}
              </div>
              <div className="flex items-center justify-end z-50 py-4 pr-4">
                <svg width="0" height="0">
                  <linearGradient id="other-red-gradient" x1="100%" y1="100%" x2="0%" y2="0%">
                    <stop stopColor="#121212" offset="0%" />
                    <stop stopColor="#ccd8e0" offset="100%" />
                  </linearGradient>
                </svg>
                <AiFillFire size={25} style={{ fill: "url(#other-red-gradient)" }} />
                <PillCoin newsCoin={news.coins} />
              </div>
            </div>
          }
        </div>
        <div className="flex items-center justify-between pl-4 w-full z-50">
          <NewsMainComment newsComment={news.comment} />
          {news.comment &&
            <div className="flex items-center justify-end z-50 py-4 pr-4">
              <svg width="0" height="0">
                <linearGradient id="red-gradient" x1="100%" y1="100%" x2="0%" y2="0%">
                  <stop stopColor="#EF4444" offset="0%" />
                  <stop stopColor="#FBBF24" offset="100%" />
                </linearGradient>
              </svg>
              <AiFillFire size={25} style={{ fill: "url(#red-gradient)" }} />
              <PillCoin newsCoin={news.coins} />
            </div>}
        </div>
      </div>
    </div>

  );
}
