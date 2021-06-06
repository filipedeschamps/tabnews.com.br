import { CgTab } from "react-icons/cg";
import { MdAccountCircle } from "react-icons/md";
import { MdMonetizationOn } from "react-icons/md";
import ToggleButton from './ToggleButton'

export default function Header() {
  return (
    <header className="m-auto pt-5 pb-8 z-0">
      <nav className="relative rounded-lg flex items-center justify-between p-2 dark:border-darkTheme-secondary shadow-xl">
        <div className="absolute rounded-lg z-0 top-0 left-0 bg-lightTheme-primary opacity-40" style={{width: "100%", height:"100%"}}/>
        <div className="flex items-center space-x-1 text-gray-800 z-10">
          <CgTab className="w-7 h-7 dark:text-darkTheme-primary" />
          <span className="text-md font-medium dark:text-darkTheme-primary">TabNews</span>
        </div>
        <div className="flex space-x-2 z-10">
          <ToggleButton/>
          <div className="flex items-center pt-1 pb-1 pl-2 pr-2 font-mono text-lg text-lightTheme-secondary bg-lightTheme-primary font-semibold rounded-lg dark:text-darkTheme-primary dark:border-darkTheme-secondary">
            <MdMonetizationOn className="w-6 h-6 mr-1 text-yellow-500 dark:text-darkTheme-yellow-400" /> 0052
            </div>
          <div className="flex items-center pt-1 pb-1 pl-2 pr-2 font-mono font-semibold text-lg text-lightTheme-secondary bg-lightTheme-primary rounded-lg dark:border-darkTheme-secondary dark:text-darkTheme-primary">
            <MdAccountCircle className="w-6 h-6  mr-1 text-lightTheme-secondary dark:text-darkTheme-green-200" /> 1430
            </div>
        </div>
      </nav>
    </header>
  );
}