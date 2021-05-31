import { Header } from '../components/Header'
import { NewsList } from '../components/NewsList'
import ThemeModeProvider from '../hooks/themeModeProvider'

export default function Home() {
  return (
    <ThemeModeProvider>
      <div className="transition-colors duration-500 dark:bg-darkTheme-background">
        <div className="pl-3 pr-3 max-w-5xl m-auto">
          <Header />
          <div className="m-auto">
            <NewsList />
          </div>
        </div>
      </div>
    </ThemeModeProvider>
  );
}