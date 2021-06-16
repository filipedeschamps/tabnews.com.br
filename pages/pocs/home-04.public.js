import Link from "next/link";
import { CgTab } from "react-icons/cg";
import { RiMoneyDollarCircleFill } from "react-icons/ri";

export default function Home() {
  return (
    <>
      {/* <header className="">
        <nav className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-1">
            <CgTab className="w-5 h-5 text-gray-700" />
            <span className="text-sm font-medium">TabNews</span>
          </div>
        </nav>
      </header> */}

      <div className="flex">
        <div className="w-full p-6 border-gray-100 md:p-5 md:w-1/3 lg:w-1/2">
          <NewsList />
        </div>
        <div className="hidden md:p-5 md:pl-0 md:flex-1 md:block 2xl:pr-14">
          <div className="flex items-start">
            <div className="w-10 pt-2 pb-2 mt-1 mr-2 text-xs leading-relaxed text-center bg-yellow-300 rounded-lg">
              1.1k
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-semibold text-gray-700">
                WhatsApp volta atrás e não vai mais desativar contas que não
                aceitarem nova política de privacidade
              </h1>
              <div className="mt-2 mb-4 text-xs font-normal text-gray-400">
                2 horas atrás por por{" "}
                <span className="font-semibold">gustavodeschamps</span>
              </div>

              <p className="mt-4 text-gray-700">
                O mensageiro, no entanto, continuará a mostrar lembretes até a
                aceitação dos novos termos de uso. Segundo a empresa, a grande
                maioria das pessoas já aceitou a atualização das políticas de
                privacidade e compartilhamento de dados com o Facebook.
              </p>
              <p className="mt-4 text-gray-700">
                As informações são do site TheNextWeb.
              </p>
            </div>
          </div>

          <hr className="mt-6 mb-6 ml-12 border-t-2 border-gray-200 border-dotted" />
          <div className="flex items-start">
            <div className="w-10 pt-2 pb-2 mt-1 mr-2 text-xs leading-relaxed text-center bg-yellow-300 rounded-lg">
              95
            </div>
            <div className="flex-1 text-gray-700">
              <p>
                Facebook está cada vez se tornando uma empresa estranha e eu
                acho que é desespero pelo motivo de todo o seu core business ser
                em volta de trackear as pessoas. Via o Google na mesma posição,
                mas eles souberam diversificar, mas é outra que deve estar
                acompanhando tudo de perto.
              </p>
              <div className="text-xs font-normal text-gray-400">
                5 minutos atrás por por{" "}
                <span className="font-semibold">filipedeschamps</span>
              </div>
            </div>
          </div>

          <hr className="mt-6 mb-6 ml-12 border-t-2 border-gray-200 border-dotted" />
          <div className="flex items-start">
            <div className="w-10 pt-2 pb-2 mt-1 mr-2 text-xs leading-relaxed text-center bg-yellow-300 rounded-lg">
              22
            </div>
            <div className="flex-1 text-gray-700">
              <p>Testando resposta muito boa de 1 linha.</p>
              <div className="text-xs font-normal text-gray-400">
                1 hora atrás por por{" "}
                <span className="font-semibold">arenata</span>
              </div>
            </div>
          </div>

          <hr className="mt-6 mb-6 ml-12 border-t-2 border-gray-200 border-dotted" />
          <div className="flex items-start">
            <div className="w-10 pt-2 pb-2 mt-1 mr-2 text-xs leading-relaxed text-center bg-yellow-300 rounded-lg">
              1
            </div>
            <div className="flex-1 text-gray-700">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis
                blandit elit at est pellentesque rhoncus. Etiam elementum odio
                at lectus aliquet, vitae suscipit arcu sodales. Nullam magna
                odio, consectetur id urna sit amet, ultricies egestas nibh.
                Integer feugiat vestibulum eros, sed pulvinar urna elementum
                nec. Aliquam feugiat, lorem ut ullamcorper tempus, purus arcu
                hendrerit sapien, ut auctor turpis risus eu est. Duis eros
                libero, dictum non pellentesque nec, ullamcorper at enim. Ut dui
                velit, viverra vitae luctus sodales, venenatis a quam. Nullam
                tristique vehicula sapien at iaculis. Vivamus eleifend vehicula
                sodales.
              </p>

              <p className="mt-4">
                Etiam malesuada pharetra lectus, in dictum metus aliquet vitae.
                Quisque justo est, ullamcorper ut dui venenatis, condimentum
                maximus lacus. Donec at massa arcu. Curabitur tincidunt urna sed
                suscipit venenatis. Suspendisse potenti. Sed facilisis
                ullamcorper dolor ullamcorper sollicitudin. Morbi pharetra
                pulvinar libero, vitae malesuada mi malesuada in. Curabitur
                interdum commodo sollicitudin. Aenean hendrerit ac orci id
                sollicitudin. Suspendisse ex nunc, sagittis eu nisi ac, maximus
                dictum nisl. Donec luctus at orci eget tincidunt. Vestibulum non
                tellus sed metus tristique eleifend. Donec vitae lacus in tellus
                molestie mollis sed quis neque. Mauris iaculis, purus non
                vulputate dignissim, ipsum erat vulputate urna, eget imperdiet
                felis risus et elit.
              </p>

              <p className="mt-4">
                Cras odio risus, viverra et ullamcorper id, consectetur id
                lectus. Ut eget mauris ipsum. Integer leo diam, porta eget nulla
                et, bibendum feugiat neque. Mauris ut orci egestas, suscipit
                elit vel, sollicitudin lacus. Maecenas consequat gravida
                lobortis. Nam arcu magna, pellentesque hendrerit ante sit amet,
                pretium cursus ex. Aenean sit amet hendrerit metus, eget tempus
                libero. Etiam a lobortis urna, quis pulvinar neque. Nunc viverra
                lacus non quam tristique, vitae vehicula orci volutpat. Maecenas
                quis ultrices quam. Duis in diam eros.
              </p>

              <div className="text-xs font-normal text-gray-400">
                6 horas atrás por por{" "}
                <span className="font-semibold">outrousuario</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function NewsList() {
  const newsItems = [
    {
      coins: "1.1k",
      author: "gustavodeschamps",
      title: "STF teria sofrido ataque hacker",
      date: "45 minutos atrás",
    },
    {
      coins: "950",
      author: "filipedeschamps",
      title:
        "WhatsApp volta atrás e não vai mais desativar contas que não aceitarem nova política de privacidade",
      date: "2 horas atrás",
    },
    {
      coins: "500",
      author: "arenata",
      title:
        "Reações nucleares estão sendo reativadas novamente em Chernobyl, 35 anos após acidente",
      date: "1 minuto atrás",
    },
    {
      coins: "160",
      author: "gustavodeschamps",
      title: "Alerta para golpe do WhatsApp voltado ao Dia das Mães",
      date: "4 horas atrás",
    },
    {
      coins: "5",
      author: "gustavodeschamps",
      title:
        "Supermercado na Polônia vai testar IA para reduzir desperdício de alimentos",
      date: "40 minutos atrás",
    },
    {
      coins: "201",
      author: "gustavodeschamps",
      title:
        "Programa que conserta e doa computadores já entregou mais de 20 mil equipamentos",
      date: "5 horas atrás",
    },
    {
      coins: "83",
      author: "gustavodeschamps",
      title:
        "Software pirata leva a ataque ransomware em instituto europeu de pesquisa biomolecular",
      date: "12 horas atrás",
    },
    {
      coins: "340",
      author: "gustavodeschamps",
      title: "Nova Iorque pode banir mineração de moedas digitais",
      date: "13 horas atrás",
    },
    {
      coins: "500",
      author: "gustavodeschamps",
      title:
        "Starlink ameaça cortar internet de usuário após download ilegal de série de TV",
      date: "15 horas atrás",
    },
    {
      coins: "1.1k",
      author: "gustavodeschamps",
      title: "STF teria sofrido ataque hacker",
      date: "45 minutos atrás",
    },
    {
      coins: "950",
      author: "filipedeschamps",
      title:
        "WhatsApp volta atrás e não vai mais desativar contas que não aceitarem nova política de privacidade",
      date: "2 horas atrás",
    },
    {
      coins: "500",
      author: "arenata",
      title:
        "Reações nucleares estão sendo reativadas novamente em Chernobyl, 35 anos após acidente",
      date: "1 minuto atrás",
    },
    {
      coins: "160",
      author: "gustavodeschamps",
      title: "Alerta para golpe do WhatsApp voltado ao Dia das Mães",
      date: "4 horas atrás",
    },
    {
      coins: "5",
      author: "gustavodeschamps",
      title:
        "Supermercado na Polônia vai testar IA para reduzir desperdício de alimentos",
      date: "40 minutos atrás",
    },
    {
      coins: "201",
      author: "gustavodeschamps",
      title:
        "Programa que conserta e doa computadores já entregou mais de 20 mil equipamentos",
      date: "5 horas atrás",
    },
    {
      coins: "83",
      author: "gustavodeschamps",
      title:
        "Software pirata leva a ataque ransomware em instituto europeu de pesquisa biomolecular",
      date: "12 horas atrás",
    },
    {
      coins: "340",
      author: "gustavodeschamps",
      title: "Nova Iorque pode banir mineração de moedas digitais",
      date: "13 horas atrás",
    },
    {
      coins: "500",
      author: "gustavodeschamps",
      title:
        "Starlink ameaça cortar internet de usuário após download ilegal de série de TV",
      date: "15 horas atrás",
    },
  ];

  return (
    <div className="flex flex-col space-y-6">
      {newsItems.map((news, index) => {
        return (
          <div className="flex items-start" key={index}>
            <div className="w-10 pt-2 pb-2 mt-1 mr-2 text-xs leading-relaxed text-center bg-yellow-300 rounded-lg">
              {news.coins}
            </div>
            <div className="flex-1">
              <div className="text-base font-medium text-gray-700">
                <Link href="#">
                  <a>{news.title}</a>
                </Link>
              </div>
              <div className="text-xs font-normal text-gray-400 ">
                {news.date} por{" "}
                <span className="font-semibold">{news.author}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
