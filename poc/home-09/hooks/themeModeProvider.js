import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ThemeModeContext = createContext({})

const ThemeModeProvider = ({ children }) => {
  const [isDarkModeOn, setIsDarkModeOn] = useState(false)

  useEffect(() => {
    const htmlELement = document.querySelector('html')
    const themeMode = localStorage.getItem('@tabnews:theme')

    if (themeMode) {
      JSON.parse(themeMode.toLowerCase()) ? htmlELement.classList.add("dark") : htmlELement.classList.remove("dark");
      JSON.parse(themeMode.toLowerCase()) ? setIsDarkModeOn(true) : setIsDarkModeOn(false)
    } else {
      localStorage.setItem('@tabnews:theme', false)
    }
  }, [isDarkModeOn])

  const handleDarkModeChange = useCallback(()=> {
    localStorage.setItem('@tabnews:theme', !isDarkModeOn)
    setIsDarkModeOn(!isDarkModeOn)
    return
  },[isDarkModeOn])

  return (
    <ThemeModeContext.Provider value={{ isDarkModeOn, handleDarkModeChange }}>
      {children}
    </ThemeModeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeModeContext)
}

export default ThemeModeProvider