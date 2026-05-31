import { Link } from '@/TabNewsUI';
import { CgTab } from '@/TabNewsUI/icons';

import classes from './index.module.css';

export default function Footer(props) {
  return (
    <footer {...props}>
      <div className={classes.Container}>
        <div className={classes.Copyright}>
          <Link className={classes.HomeLink} href="/" aria-label="Voltar para a página inicial">
            <CgTab size={26} />
          </Link>
          &copy; {new Date().getFullYear()} TabNews
        </div>
        <div className={classes.Links}>
          {/* Ordered alphabetically. */}
          <Link href="/contato">Contato</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="https://github.com/filipedeschamps/tabnews.com.br">GitHub</Link>
          <Link href="/museu">Museu</Link>
          <Link href="/recentes/rss">RSS</Link>
          <Link href="https://www.tabnews.com.br/filipedeschamps/tentando-construir-um-pedaco-de-internet-mais-massa">
            Sobre
          </Link>
          <Link href="/status">Status</Link>
          <Link href="/termos-de-uso">Termos de Uso</Link>
          <Link href="https://curso.dev">curso.dev</Link>
        </div>
      </div>
    </footer>
  );
}
