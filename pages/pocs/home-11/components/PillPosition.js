import Link from "next/link";

export default function PillPosition({ index }) {
  return (
    <div
      className={`flex w-min px-2 pr-6 pt-1 pb-1 font-semibold text-center
        ${index === 0
          ? "hidden"
          : "text-3xl text-transparent bg-clip-text bg-gradient-to-br from-gray-400 to-gray-600 dark:text-darkTheme-primary dark:border-darkTheme-primary"
        }
      `}
      style={{height: "fit-content"}}
    >
      {index + 1}
    </div>
  );
}
