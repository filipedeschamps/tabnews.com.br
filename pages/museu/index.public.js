import { Box, Link, Text } from '@primer/react';
import { DefaultLayout } from 'pages/interface';

export default function Page() {
  return (
    <DefaultLayout
      metadata={{
        title: 'Museu',
        description: 'Esta página é humilde, porém traz coisas muito importantes da história do Tabnews.',
      }}>
      <Box>
        <Text as="h1">Museu TabNews</Text>
        <Text as="p">
          Esta página é humilde, porém traz coisas <strong>muito importantes</strong> da história do Tabnews.
        </Text>
        <Text as="p">
          Então abaixo listamos as primeiras interfaces que o projeto teve, incluindo algumas Provas de Conceito (POC).
        </Text>

        <ul className="list">
          <li>
            <Link href="/museu/init.html">Primeira Home Oficial (Init)</Link> feito pelos Membros da Turma
          </li>
          <li>
            <Link href="/museu/construction-01.html">Em Construção POC #01</Link> feito por{' '}
            <Link href="https://github.com/rodrigoKulb">Rodrigo Kulb</Link>
          </li>
          <li>
            <Link href="/museu/construction-03.html">Em Construção POC #03</Link> feito por{' '}
            <Link href="https://github.com/brunofamiliar">Bruno Familiar</Link>
          </li>
          <li>
            <Link href="/museu/home-01.html">Home POC #01</Link> feito por{' '}
            <Link href="https://github.com/filipedeschamps">Filipe Deschamps</Link>
          </li>
          <li>
            <Link href="/museu/home-02.html">Home POC #02</Link> feito por{' '}
            <Link href="https://github.com/filipedeschamps">Filipe Deschamps</Link>
          </li>
          <li>
            <Link href="/museu/home-03.html">Home POC #03</Link> feito por{' '}
            <Link href="https://github.com/filipedeschamps">Filipe Deschamps</Link>
          </li>
          <li>
            <Link href="/museu/home-04.html">Home POC #04</Link> feito por{' '}
            <Link href="https://github.com/filipedeschamps">Filipe Deschamps</Link>
          </li>
          <li>
            <Link href="/museu/home-05.html">Home POC #05</Link> feito por{' '}
            <Link href="https://github.com/filipedeschamps">Filipe Deschamps</Link>
          </li>
          <li>
            <Link href="/museu/home-06.html">Home POC #06</Link> feito por{' '}
            <Link href="https://github.com/filipedeschamps">Filipe Deschamps</Link>
          </li>
          <li>
            <Link href="/museu/home-07.html">Home POC #07</Link> feito por{' '}
            <Link href="https://github.com/filipedeschamps">Filipe Deschamps</Link>
          </li>
          <li>
            <Link href="/museu/home-08.html">Home POC #08</Link> feito por{' '}
            <Link href="https://github.com/filipedeschamps">Filipe Deschamps</Link>
          </li>
          <li>
            <Link href="/museu/home-09.html">Home POC #09 - Dark Mode</Link> feito por{' '}
            <Link href="https://github.com/pscruzzz">Pedro Cruz</Link>
          </li>
          <li>
            <Link href="/museu/home-10.html">Home POC #10</Link> feito por{' '}
            <Link href="https://github.com/peguimasid">Guilhermo Masid</Link>
          </li>
          <li>
            <Link href="/museu/home-10-mobile.html">Home POC #10 - Mobile</Link> feito por{' '}
            <Link href="https://github.com/rodrigoKulb">Rodrigo Kulb</Link>
          </li>
          <li>
            <Link href="/museu/home-11.html">Home POC #11</Link> feito por{' '}
            <Link href="https://github.com/pscruzzz">Pedro Cruz</Link>
          </li>
          <li>
            <Link href="/museu/home-12.html">Home POC #12</Link> feito por{' '}
            <Link href="https://github.com/luantoningalvan">Luan Tonin Galvan</Link>
          </li>
          <li>
            <Link href="/museu/post-01.html">Post POC #01</Link> feito por{' '}
            <Link href="https://github.com/filipedeschamps">Filipe Deschamps</Link>
          </li>
          <li>
            <Link href="/museu/post-02.html">Post POC #02</Link> feito por{' '}
            <Link href="https://github.com/pscruzzz">Pedro Cruz</Link>
          </li>
        </ul>
      </Box>

      <style jsx>{`
        .list {
          margin-top: 2rem;
          list-style: circle;
        }
      `}</style>
    </DefaultLayout>
  );
}
