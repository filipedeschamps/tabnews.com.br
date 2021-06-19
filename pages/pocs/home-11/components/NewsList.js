import Link from "next/link";
import { FaStar } from "react-icons/fa";
import { useData } from '../hooks/useData';
import PillCoin from './PillCoin';
import NewsDetails from './NewsDetails'
import NewsMainComment from './NewsMainComment'
import PillPosition from './PillPosition'

export default function NewsList() {
  const { newsData } = useData()

  if (!newsData) {
    return
  }

  return (
    <div className="flex flex-col space-y-8 w-full">
      {newsData.map((news, index) => {
        return (
            <div className="w-full flex font-sans items-center justify-between rounded-lg" key={index}>
              <PillPosition index={index}/>
              {/* <PillCoin index={index} newsCoin={news.coins} /> */}
              <div className="flex flex-col flex-1 w-11/12">
                <NewsDetails newsAuthor={news.author} newsDate={news.date} newsTitle={news.title} index={index} news={news} />
              </div>
            </div>
        );
      })}
    </div>
  );
}
