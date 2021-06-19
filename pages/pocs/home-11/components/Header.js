import { CgTab } from "react-icons/cg";
import { IoMdPerson } from "react-icons/io";
import { GiTwoCoins } from "react-icons/gi";
import ToggleButton from './ToggleButton'

export default function Header() {
  return (
    <header className="m-auto pt-5 pb-8 z-0">
      <nav className="relative rounded-lg flex items-center justify-between p-2 dark:border-darkTheme-secondary shadow-lg">
        <div className="absolute rounded-lg z-0 top-0 left-0 bg-lightTheme-primary opacity-40" style={{width: "100%", height:"100%"}}/>
        <div className="flex items-center space-x-1 text-gray-800 z-10">
          <CgTab className="w-7 h-7 dark:text-darkTheme-primary" />
          <span className="text-md font-medium dark:text-darkTheme-primary">TabNews</span>
        </div>
        <div className="flex space-x-2 z-10">
          <ToggleButton/>
          <div className="flex shadow-md border border-lightTheme-primary items-center pt-1 pb-1 pl-2 pr-2 font-mono text-lg text-lightTheme-secondary font-regular rounded-lg dark:text-darkTheme-primary dark:border-darkTheme-secondary">
            <svg width="0" height="0">
              <linearGradient id="header-red-gradient" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop stopColor="#e06c6c" offset="0%" />
                <stop stopColor="#FBBF24" offset="100%" />
              </linearGradient>
            </svg>
            <GiTwoCoins style={{ fill: "url(#header-red-gradient)" }}  className="w-6 h-6 mr-1 text-gray-800 dark:text-darkTheme-yellow-400" /> 0052
            </div>
          <div className="flex shadow-md border border-lightTheme-primary items-center pt-1 pb-1 pl-2 pr-2 font-mono font-regular text-lg text-lightTheme-secondary to-green-100 rounded-lg dark:border-darkTheme-secondary dark:text-darkTheme-primary">
            <svg width="0" height="0">
              <linearGradient id="header-blue-gradient" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop stopColor="#5ebdae" offset="0%" />
                <stop stopColor="#36689e" offset="100%" />
              </linearGradient>
            </svg>
            <IoMdPerson style={{ fill: "url(#header-blue-gradient)" }} className="w-6 h-6  mr-1 text-gray-800 dark:text-darkTheme-green-200" /> 1430
            </div>
        </div>
      </nav>
    </header>
  );
}