import Head from 'next/head';

export default function Page() {
  return (
    <>
      <Head>
        <title>Museu TabNews</title>
      </Head>
      <div className="page-margin">
        <h1>Museu TabNews</h1>
        <p>
          Esta página é humilde, porém traz coisas <strong>muito importantes</strong> da história do Tabnews.
        </p>
        <p>
          Então abaixo listamos as primeiras interfaces que o projeto teve, incluindo algumas Provas de Conceito (POC).
        </p>

        <ul className="list">
          <li>
            <a href="/museu/init.html">Primeira Home Oficial (Init)</a> feito pelos Membros da Turma
          </li>
          <li>
            <a href="/museu/construction-01.html">Em Construção POC #01</a> feito por{' '}
            <a href="https://github.com/rodrigoKulb">Rodrigo Kulb</a>
          </li>
          <li>
            <a href="/museu/construction-03.html">Em Construção POC #03</a> feito por{' '}
            <a href="https://github.com/brunofamiliar">Bruno Familiar</a>
          </li>
          <li>
            <a href="/museu/home-01.html">Home POC #01</a> feito por{' '}
            <a href="https://github.com/filipedeschamps">Filipe Deschamps</a>
          </li>
          <li>
            <a href="/museu/home-02.html">Home POC #02</a> feito por{' '}
            <a href="https://github.com/filipedeschamps">Filipe Deschamps</a>
          </li>
          <li>
            <a href="/museu/home-03.html">Home POC #03</a> feito por{' '}
            <a href="https://github.com/filipedeschamps">Filipe Deschamps</a>
          </li>
          <li>
            <a href="/museu/home-04.html">Home POC #04</a> feito por{' '}
            <a href="https://github.com/filipedeschamps">Filipe Deschamps</a>
          </li>
          <li>
            <a href="/museu/home-05.html">Home POC #05</a> feito por{' '}
            <a href="https://github.com/filipedeschamps">Filipe Deschamps</a>
          </li>
          <li>
            <a href="/museu/home-06.html">Home POC #06</a> feito por{' '}
            <a href="https://github.com/filipedeschamps">Filipe Deschamps</a>
          </li>
          <li>
            <a href="/museu/home-07.html">Home POC #07</a> feito por{' '}
            <a href="https://github.com/filipedeschamps">Filipe Deschamps</a>
          </li>
          <li>
            <a href="/museu/home-08.html">Home POC #08</a> feito por{' '}
            <a href="https://github.com/filipedeschamps">Filipe Deschamps</a>
          </li>
          <li>
            <a href="/museu/home-09.html">Home POC #09 - Dark Mode</a> feito por{' '}
            <a href="https://github.com/pscruzzz">Pedro Cruz</a>
          </li>
          <li>
            <a href="/museu/home-10.html">Home POC #10</a> feito por{' '}
            <a href="https://github.com/peguimasid">Guilhermo Masid</a>
          </li>
          <li>
            <a href="/museu/home-10-mobile.html">Home POC #10 - Mobile</a> feito por{' '}
            <a href="https://github.com/rodrigoKulb">Rodrigo Kulb</a>
          </li>
          <li>
            <a href="/museu/home-11.html">Home POC #11</a> feito por{' '}
            <a href="https://github.com/pscruzzz">Pedro Cruz</a>
          </li>
          <li>
            <a href="/museu/home-12.html">Home POC #12</a> feito por{' '}
            <a href="https://github.com/luantoningalvan">Luan Tonin Galvan</a>
          </li>
          <li>
            <a href="/museu/post-01.html">Post POC #01</a> feito por{' '}
            <a href="https://github.com/filipedeschamps">Filipe Deschamps</a>
          </li>
          <li>
            <a href="/museu/post-02.html">Post POC #02</a> feito por{' '}
            <a href="https://github.com/pscruzzz">Pedro Cruz</a>
          </li>
        </ul>
      </div>

      <style jsx>{`
        .page-margin {
          margin: 2rem;
        }

        a {
          color: #00f;
          text-decoration: underline;
        }

        h1 {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .list {
          margin-top: 2rem;
          list-style: circle;
        }
      `}</style>
    </>
  );
}
