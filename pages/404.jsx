import Image from 'next/image';

import { DefaultLayout, Link } from '@/TabNewsUI';
import botSleepyFaceDarkTransparent from 'public/brand/bot-sleepy-face-dark-transparent.svg';

import classes from './404.module.css';

export default function Custom404() {
  return (
    <DefaultLayout metadata={{ title: '404 - Página não encontrada' }}>
      <div className={classes.Wrapper}>
        <div className={classes.Content}>
          <Image src={botSleepyFaceDarkTransparent.src} height={100} width={100} alt="Ícone do Bot triste" />
          <div className={classes.Divider}></div>
          <h1>404</h1>
        </div>
        <h2>Página não encontrada</h2>
        <Link href="/">Retornar à tela inicial</Link>
      </div>
    </DefaultLayout>
  );
}
