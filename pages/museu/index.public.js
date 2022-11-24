import { Box, DefaultLayout, PrimerLink, Text } from '@/TabNewsUI';

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
            <PrimerLink href="/museu/init.html">Primeira Home Oficial (Init)</PrimerLink> feito pelos Membros da Turma
          </li>
          <li>
            <PrimerLink href="/museu/construction-01.html">Em Construção POC #01</PrimerLink> feito por{' '}
            <PrimerLink href="https://github.com/rodrigoKulb">Rodrigo Kulb</PrimerLink>
          </li>
          <li>
            <PrimerLink href="/museu/construction-03.html">Em Construção POC #03</PrimerLink> feito por{' '}
            <PrimerLink href="https://github.com/brunofamiliar">Bruno Familiar</PrimerLink>
          </li>
          <li>
            <PrimerLink href="/museu/home-01.html">Home POC #01</PrimerLink> feito por{' '}
            <PrimerLink href="https://github.com/filipedeschamps">Filipe Deschamps</PrimerLink>
          </li>
          <li>
            <PrimerLink href="/museu/home-02.html">Home POC #02</PrimerLink> feito por{' '}
            <PrimerLink href="https://github.com/filipedeschamps">Filipe Deschamps</PrimerLink>
          </li>
          <li>
            <PrimerLink href="/museu/home-03.html">Home POC #03</PrimerLink> feito por{' '}
            <PrimerLink href="https://github.com/filipedeschamps">Filipe Deschamps</PrimerLink>
          </li>
          <li>
            <PrimerLink href="/museu/home-04.html">Home POC #04</PrimerLink> feito por{' '}
            <PrimerLink href="https://github.com/filipedeschamps">Filipe Deschamps</PrimerLink>
          </li>
          <li>
            <PrimerLink href="/museu/home-05.html">Home POC #05</PrimerLink> feito por{' '}
            <PrimerLink href="https://github.com/filipedeschamps">Filipe Deschamps</PrimerLink>
          </li>
          <li>
            <PrimerLink href="/museu/home-06.html">Home POC #06</PrimerLink> feito por{' '}
            <PrimerLink href="https://github.com/filipedeschamps">Filipe Deschamps</PrimerLink>
          </li>
          <li>
            <PrimerLink href="/museu/home-07.html">Home POC #07</PrimerLink> feito por{' '}
            <PrimerLink href="https://github.com/filipedeschamps">Filipe Deschamps</PrimerLink>
          </li>
          <li>
            <PrimerLink href="/museu/home-08.html">Home POC #08</PrimerLink> feito por{' '}
            <PrimerLink href="https://github.com/filipedeschamps">Filipe Deschamps</PrimerLink>
          </li>
          <li>
            <PrimerLink href="/museu/home-09.html">Home POC #09 - Dark Mode</PrimerLink> feito por{' '}
            <PrimerLink href="https://github.com/pscruzzz">Pedro Cruz</PrimerLink>
          </li>
          <li>
            <PrimerLink href="/museu/home-10.html">Home POC #10</PrimerLink> feito por{' '}
            <PrimerLink href="https://github.com/peguimasid">Guilhermo Masid</PrimerLink>
          </li>
          <li>
            <PrimerLink href="/museu/home-10-mobile.html">Home POC #10 - Mobile</PrimerLink> feito por{' '}
            <PrimerLink href="https://github.com/rodrigoKulb">Rodrigo Kulb</PrimerLink>
          </li>
          <li>
            <PrimerLink href="/museu/home-11.html">Home POC #11</PrimerLink> feito por{' '}
            <PrimerLink href="https://github.com/pscruzzz">Pedro Cruz</PrimerLink>
          </li>
          <li>
            <PrimerLink href="/museu/home-12.html">Home POC #12</PrimerLink> feito por{' '}
            <PrimerLink href="https://github.com/luantoningalvan">Luan Tonin Galvan</PrimerLink>
          </li>
          <li>
            <PrimerLink href="/museu/post-01.html">Post POC #01</PrimerLink> feito por{' '}
            <PrimerLink href="https://github.com/filipedeschamps">Filipe Deschamps</PrimerLink>
          </li>
          <li>
            <PrimerLink href="/museu/post-02.html">Post POC #02</PrimerLink> feito por{' '}
            <PrimerLink href="https://github.com/pscruzzz">Pedro Cruz</PrimerLink>
          </li>
        </ul>

        <Text as="p">Abaixo temos um artigo que fala as principais mudanças do TabNews desde o início do projeto.</Text>
        <ul>
          <li>
            <Link href="/museu/evolution-of-tabnews.html">A Evolução do TabNews</Link> feito por{' '}
            <Link href="https://github.com/gabrielsozinho">Gabriel Sozinho</Link>
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
