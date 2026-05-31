import Image from 'next/image';

import { DefaultLayout, Link } from '@/TabNewsUI';
import botDeadFaceDarkTransparent from 'public/brand/bot-dead-face-dark-transparent.svg';

import classes from './500.module.css';

export default function Custom500() {
  return (
    <DefaultLayout metadata={{ title: '500 - Erro Interno Não Esperado' }}>
      <div className={classes.Wrapper}>
        <div className={classes.Content}>
          <Image src={botDeadFaceDarkTransparent.src} height={100} width={100} alt="Ícone do Bot desacordado" />
          <div className={classes.Divider}></div>
          <h1>500</h1>
        </div>
        <h2>Um erro interno não esperado aconteceu.</h2>
        <Link href="/">Retornar à tela inicial</Link>
      </div>
    </DefaultLayout>
  );
}
