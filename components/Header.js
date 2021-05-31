import { CgTab } from "react-icons/cg";
import { MdAccountCircle } from "react-icons/md";
import { MdMonetizationOn } from "react-icons/md";
import { ToggleButton} from './ToggleButton'

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