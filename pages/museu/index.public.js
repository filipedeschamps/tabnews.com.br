import { Box, DefaultLayout, PrimerLink, Text } from '@/TabNewsUI';

export default function Page() {
  return (
    <DefaultLayout
      metadata={{
        title: 'Museu',
        description: 'Esta página é humilde, porém traz coisas muito importantes da história do TabNews.',
      }}>
      <Box>
        <Text as="h1">Museu TabNews</Text>
        <Text as="p">
          Esta página é humilde, porém traz coisas <strong>muito importantes</strong> da história do TabNews.
        </Text>

        <Text as="h2">Artigo</Text>
        <Box as="ul">
          <li>
            <PrimerLink href="/museu/evolucao-do-tabnews">
              A Evolução do TabNews — da Concepção ao Lançamento
            </PrimerLink>{' '}
            feito por <PrimerLink href="https://github.com/gabrielsozinho">Gabriel Sozinho</PrimerLink>
          </li>
        </Box>

        <Text as="h2">Primeiras interfaces e Provas de Conceito (POC)</Text>

        <Box as="ul">
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
        </Box>
      </Box>
    </DefaultLayout>
  );
}
