import {useTheme} from '../hooks/useTheme'

export default function ToggleButton() {
  const {isDarkModeOn, handleDarkModeChange} = useTheme()

  return (
    <button className="border border-lightTheme-primary text-lightTheme-secondary bg-gradient-to-r from-lightTheme-background-secondary to-lightTheme-background-primary font-semibold dark:border-darkTheme-secondary text-gray-700 focus:outline-none px-4 rounded-lg dark:text-darkTheme-primary" type="button" onClick={()=>{handleDarkModeChange()}}>
      {isDarkModeOn ? "Desligar Dark Mode" : "Ligar Dark Mode"}
    </button>
  );
}