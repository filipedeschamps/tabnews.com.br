import Link from "next/link";

export default function PillCoin({ index, newsCoin }) {
  return (
    <>
      <Link href="#">
        <a className="flex flex-col items-center self-start pl-2">
          <div
            className={`w-full text-lg font-medium text-center rounded-lg rounded-t-none
                  ${
              index === 0
                ? "text-yellow-900 dark:text-darkTheme-background dark:bg-darkTheme-yellow-400"
                : "text-gray-700 dark:text-darkTheme-background dark:bg-darkTheme-primary"
              }
                  `}
          >
            {/* {news.coins} */}
            {newsCoin}
          </div>
        </a>
      </Link>
    </>
  );
}
