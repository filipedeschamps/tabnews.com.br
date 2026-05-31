import { GoToTopButton } from '@tabnews/ui';

import { Footer, Header } from '@/TabNewsUI';
import { Head } from 'interface';

import classes from './index.module.css';

const containerMaxWidth = {
  small: '544px',
  medium: '768px',
  large: '1012px',
  xlarge: '1280px',
};

export default function DefaultLayout({ children, containerWidth = 'large', metadata }) {
  const maxWidth = containerMaxWidth[containerWidth] ?? containerWidth;

  return (
    <div className={classes.Wrapper}>
      {metadata && <Head metadata={metadata} />}
      <Header />
      <main className={classes.Main} style={{ maxWidth }}>
        {children}
      </main>
      <Footer className={classes.Footer} style={{ maxWidth }} />
      <GoToTopButton target="header" />
    </div>
  );
}
