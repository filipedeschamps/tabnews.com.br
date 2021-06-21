import { FaStar } from "react-icons/fa";

export default function NewsMainComment({newsComment}) {
  return (
    <div style={{height: "fit-content", maxWidth:"85%"}} className="rounded-lg flex max-w-3xl text-md tracking-tight bg-lightTheme-primary text-lightTheme-secondary dark:text-darkTheme-yellow-200">
      {newsComment && (
        <div className="p-2 flex items-center w-full">
          <FaStar size={15} className="mr-1 text-yellow-500 dark:text-darkTheme-yellow-200" />
          <div className="flex-1 truncate">
            Comentário destaque: "{newsComment}"
          </div>
        </div>
      )}
    </div>
  );
}
