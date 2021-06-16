import Link from "next/link";
import { CgTab } from "react-icons/cg";
import { BsFillChatFill } from "react-icons/bs";
import { RiMoneyDollarCircleFill } from "react-icons/ri";

export default function Home() {
  return (
    <div className="pt-5 pb-5 bg-gray-100">
      <div className="flex max-w-3xl mx-auto ">
        <PostsList />
      </div>
    </div>
  );
}

function PostsList() {
  const posts = [
    {
      title:
        "Ministério Público Federal, SENACON, CADE e ANPD recomendam que WhatsApp adie nova política de privacidade",
      text:
        "Os órgãos também sugerem que não se restrinja o acesso às funcionalidades do aplicativo, conduta considerada irreversível e com potencial altamente danoso. O MPF ameaçou entrar com uma ação judicial para garantir o acesso de usuários caso o WhatsApp não responda ou tome providências até esta segunda-feira, dia 10 de maio. As informações são do site Mobile Time.",
      author: "gustavodeschamps",
      coins: "1.500",
      date: "3 hora atrás",
    },
    {
      title:
        "EUA decretam estado de emergência após ataque ransomware ao maior oleoduto do país",
      text:
        "O Colonial Pipeline escoa 45% de todo os combustíveis refinados como gasolina, querosene de aviação e óleo para aquecimento na costa leste dos EUA. A gangue russa DarkSide estaria por trás do ataque. As informações são do site The Register.",
      author: "filipedeschamps",
      coins: "954",
      date: "1 hora atrás",
    },
    {
      title:
        "Drones que “fazem chover” serão testados nos Emirados Árabes Unidos",
      text:
        "Os drones realizam uma descarga elétrica dentro de nuvens, fazendo gotas de água se aglomerarem e caírem como chuva. A técnica é diferente da tradicional semeadura de nuvens, na qual partículas sólidas, como sal ou iodeto de prata, são depositadas para estimular a precipitação. As informações são da página de imprensa da Universidade de Bath.",
      author: "arenata",
      coins: "1.223",
      date: "7 hora atrás",
    },
    {
      title: "STF contém invasão aos sistemas do Tribunal",
      text:
        "O acesso “fora do padrão” foi repelido enquanto ainda estava em andamento e apenas dados públicos e características técnicas do ambiente foram acessados, sem o comprometimento de informações sigilosas. A equipe técnica do Tribunal ainda trabalha para retomada gradual dos serviços. As informações são da página de imprensa do STF.",
      author: "gustavodeschamps",
      coins: "450",
      date: "8 hora atrás",
    },
    {
      title:
        "Ministério Público Federal, SENACON, CADE e ANPD recomendam que WhatsApp adie nova política de privacidade",
      text:
        "Os órgãos também sugerem que não se restrinja o acesso às funcionalidades do aplicativo, conduta considerada irreversível e com potencial altamente danoso. O MPF ameaçou entrar com uma ação judicial para garantir o acesso de usuários caso o WhatsApp não responda ou tome providências até esta segunda-feira, dia 10 de maio. As informações são do site Mobile Time.",
      author: "gustavodeschamps",
      coins: "1.500",
      date: "3 hora atrás",
    },
  ];

  return (
    <div className="flex flex-col space-y-4">
      {posts.map((post, index) => {
        return (
          <Link href="#">
            <a className="flex p-6 bg-white rounded-md shadow-sm">
              <div className="flex flex-col items-center pl-2 pr-6 space-y-4 text-sm tracking-tight text-center">
                <div className="flex flex-col font-bold text-yellow-500">
                  <div>
                    <RiMoneyDollarCircleFill className="w-10 h-10" />
                  </div>
                  <div>{post.coins}</div>
                </div>
                <div className="flex flex-col font-bold text-blue-500">
                  <div>
                    <BsFillChatFill className="w-9 h-9" />
                  </div>
                  <div>{post.coins}</div>
                </div>
              </div>

              <div className="flex-1 text-gray-700">
                <span className="text-base font-semibold">{post.title}:</span>{" "}
                <span className="text-base">{post.text}</span>
                <div className="mt-2 text-sm text-gray-400">
                  {post.date} por <strong>{post.author}</strong>
                </div>
              </div>
            </a>
          </Link>
        );
      })}
    </div>
  );
}

// function OldHome() {
//   return (
//     <>
//       <header className="border-b-2 border-gray-200">
//         <nav className="flex items-center justify-between p-3">
//           <div className="flex items-center space-x-1">
//             <CgTab className="w-5 h-5 text-gray-700" />
//             <span className="text-sm font-medium">TabNews</span>
//           </div>
//           {/* <div className="flex items-center space-x-1">
//             <Link href="#">
//               <a className="p-2 text-sm ">Login</a>
//             </Link>
//             <Link href="#">
//               <a className="px-2 py-1 text-sm font-medium border border-gray-200 rounded-sm hover:border-gray-250 hover:bg-gray-50">
//                 Cadastro
//               </a>
//             </Link>
//           </div> */}
//         </nav>
//       </header>
//       <div className="flex m-2">
//         <div className="bg-gray-100 rounded-md w-96">
//           <NewsList />
//         </div>
//         <div className=""></div>
//       </div>
//     </>
//   );
// }
