import {useTheme} from '../hooks/themeModeProvider'

export function ToggleButton() {
  const {isDarkModeOn, handleDarkModeChange} = useTheme()

  return (
    <button className="border border-gray-300 dark:border-darkTheme-secondary text-gray-700 focus:outline-none px-4 rounded-lg dark:text-darkTheme-primary" type="button" onClick={()=>{handleDarkModeChange()}}>
      {isDarkModeOn ? "Desligar Dark Mode" : "Ligar Dark Mode"}
    </button>
  );
}