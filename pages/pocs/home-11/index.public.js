import ThemeModeProvider from './hooks/useTheme'
import Header from './components/Header'
import NewsList from './components/NewsList'
import DataProvider from './hooks/useData'

export default function Home() {
  return (
    <ThemeModeProvider>
      <DataProvider>
        <div className="bg-gradient-to-r from-lightTheme-background-primary to-lightTheme-background-secondary transition-colors duration-500 bg-lightTheme-background dark:bg-darkTheme-background">
          <div className="pl-3 pr-3 max-w-5xl m-auto">
            <Header />
            <div className="m-auto z-50">
              <NewsList />
            </div>
          </div>
        </div>
      </DataProvider>
    </ThemeModeProvider>
  );
}