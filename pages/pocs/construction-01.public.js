import { CgTab } from "react-icons/cg";
import { SiYoutube } from "react-icons/si";
import { AiFillGithub } from "react-icons/ai";
import teclado from './img/teclado.jpg';


const members = [
  {
    "name": "Fernando Andrade",
    "img": "https://avatars.githubusercontent.com/u/3598030?s=52&v=4",
    "link": "https://github.com/fernandofreamunde"
  },
  {
    "name": "Carlos Rocha",
    "img": "https://avatars.githubusercontent.com/u/3737837?s=52&v=4",
    "link": "https://github.com/imersivus"
  },
  {
    "name": "Filipe Deschamps",
    "img": "  https://avatars.githubusercontent.com/u/4248081?s=52&v=4",
    "link": "https://github.com/filipedeschamps"
  },
  {
    "name": "Rodrigo Kulb",
    "img": "https://avatars.githubusercontent.com/u/5334261?s=52&v=4",
    "link": "https://github.com/rodrigoKulb"
  },
  {
    "name": "Luan Tonin Galvan",
    "img": "https://avatars.githubusercontent.com/u/10868900?s=52&v=4",
    "link": "https://github.com/luantoningalvan"
  },
  {
    "name": "Franco Brunetta Pan",
    "img": "https://avatars.githubusercontent.com/u/18602545?s=52&v=4",
    "link": "https://github.com/francopan"
  },
  {
    "name": "André I. Smaniotto",
    "img": "https://avatars.githubusercontent.com/u/22307816?s=52&v=4",
    "link": "https://github.com/aismaniotto"
  },
  {
    "name": "Bruno De Masi",
    "img": "https://avatars.githubusercontent.com/u/26263398?s=52&v=4",
    "link": "https://github.com/brunodmsi"
  },
  {
    "name": "Régis Kensy",
    "img": "https://avatars.githubusercontent.com/u/27790698?s=52&v=4",
    "link": "https://github.com/regiskensy"
  },
  {
    "name": "Edson Bruno",
    "img": "https://avatars.githubusercontent.com/u/32016729?s=52&v=4",
    "link": "https://github.com/brunofamiliar"
  },
  {
    "name": "Elci Junior",
    "img": "https://avatars.githubusercontent.com/u/32462908?s=52&v=4",
    "link": "https://github.com/JuniorUbarana"
  },
  {
    "name": "Thiago Henrique Domingues",
    "img": "https://avatars.githubusercontent.com/u/39653866?s=52&v=4",
    "link": "https://github.com/thenriquedb"
  },
  {
    "name": "Davidsouza20",
    "img": "https://avatars.githubusercontent.com/u/42478191?s=52&v=4",
    "link": "https://github.com/Davidsouza20"
  },
  {
    "name": "Felipe D. S. Lima",
    "img": "https://avatars.githubusercontent.com/u/46056744?s=52&v=4",
    "link": "https://github.com/felipe-ds-lima"
  },
  {
    "name": "VITOR PEREIRA",
    "img": "https://avatars.githubusercontent.com/u/47868559?s=52&v=4",
    "link": "https://github.com/VOP1234"
  },
  {
    "name": "Carlos David",
    "img": "https://avatars.githubusercontent.com/u/58746461?s=52&v=4",
    "link": "https://github.com/carlosdavid0"
  },
  {
    "name": "Dan",
    "img": "https://avatars.githubusercontent.com/u/62217873?s=52&v=4",
    "link": "https://github.com/danwhat"
  },
  {
    "name": "Fernando Andrade",
    "img": "https://avatars.githubusercontent.com/u/3598030?s=52&v=4",
    "link": "https://github.com/fernandofreamunde"
  },
  {
    "name": "Carlos Rocha",
    "img": "https://avatars.githubusercontent.com/u/3737837?s=52&v=4",
    "link": "https://github.com/imersivus"
  },
  {
    "name": "Filipe Deschamps",
    "img": "  https://avatars.githubusercontent.com/u/4248081?s=52&v=4",
    "link": "https://github.com/filipedeschamps"
  },
  {
    "name": "Rodrigo Kulb",
    "img": "https://avatars.githubusercontent.com/u/5334261?s=52&v=4",
    "link": "https://github.com/rodrigoKulb"
  },
  {
    "name": "Luan Tonin Galvan",
    "img": "https://avatars.githubusercontent.com/u/10868900?s=52&v=4",
    "link": "https://github.com/luantoningalvan"
  },
  {
    "name": "Franco Brunetta Pan",
    "img": "https://avatars.githubusercontent.com/u/18602545?s=52&v=4",
    "link": "https://github.com/francopan"
  },
  {
    "name": "André I. Smaniotto",
    "img": "https://avatars.githubusercontent.com/u/22307816?s=52&v=4",
    "link": "https://github.com/aismaniotto"
  },
  {
    "name": "Bruno De Masi",
    "img": "https://avatars.githubusercontent.com/u/26263398?s=52&v=4",
    "link": "https://github.com/brunodmsi"
  },
  {
    "name": "Régis Kensy",
    "img": "https://avatars.githubusercontent.com/u/27790698?s=52&v=4",
    "link": "https://github.com/regiskensy"
  },
  {
    "name": "Edson Bruno",
    "img": "https://avatars.githubusercontent.com/u/32016729?s=52&v=4",
    "link": "https://github.com/brunofamiliar"
  },
  {
    "name": "Elci Junior",
    "img": "https://avatars.githubusercontent.com/u/32462908?s=52&v=4",
    "link": "https://github.com/JuniorUbarana"
  },
  {
    "name": "Thiago Henrique Domingues",
    "img": "https://avatars.githubusercontent.com/u/39653866?s=52&v=4",
    "link": "https://github.com/thenriquedb"
  },
  {
    "name": "Davidsouza20",
    "img": "https://avatars.githubusercontent.com/u/42478191?s=52&v=4",
    "link": "https://github.com/Davidsouza20"
  },
  {
    "name": "Felipe D. S. Lima",
    "img": "https://avatars.githubusercontent.com/u/46056744?s=52&v=4",
    "link": "https://github.com/felipe-ds-lima"
  },
  {
    "name": "VITOR PEREIRA",
    "img": "https://avatars.githubusercontent.com/u/47868559?s=52&v=4",
    "link": "https://github.com/VOP1234"
  },
  {
    "name": "Carlos David",
    "img": "https://avatars.githubusercontent.com/u/58746461?s=52&v=4",
    "link": "https://github.com/carlosdavid0"
  },
  {
    "name": "Dan",
    "img": "https://avatars.githubusercontent.com/u/62217873?s=52&v=4",
    "link": "https://github.com/danwhat"
  },
    {
    "name": "Fernando Andrade",
    "img": "https://avatars.githubusercontent.com/u/3598030?s=52&v=4",
    "link": "https://github.com/fernandofreamunde"
  },
  {
    "name": "Carlos Rocha",
    "img": "https://avatars.githubusercontent.com/u/3737837?s=52&v=4",
    "link": "https://github.com/imersivus"
  },
  {
    "name": "Filipe Deschamps",
    "img": "  https://avatars.githubusercontent.com/u/4248081?s=52&v=4",
    "link": "https://github.com/filipedeschamps"
  },
  {
    "name": "Rodrigo Kulb",
    "img": "https://avatars.githubusercontent.com/u/5334261?s=52&v=4",
    "link": "https://github.com/rodrigoKulb"
  },
  {
    "name": "Luan Tonin Galvan",
    "img": "https://avatars.githubusercontent.com/u/10868900?s=52&v=4",
    "link": "https://github.com/luantoningalvan"
  },
  {
    "name": "Franco Brunetta Pan",
    "img": "https://avatars.githubusercontent.com/u/18602545?s=52&v=4",
    "link": "https://github.com/francopan"
  },
  {
    "name": "André I. Smaniotto",
    "img": "https://avatars.githubusercontent.com/u/22307816?s=52&v=4",
    "link": "https://github.com/aismaniotto"
  },
  {
    "name": "Bruno De Masi",
    "img": "https://avatars.githubusercontent.com/u/26263398?s=52&v=4",
    "link": "https://github.com/brunodmsi"
  },
  {
    "name": "Régis Kensy",
    "img": "https://avatars.githubusercontent.com/u/27790698?s=52&v=4",
    "link": "https://github.com/regiskensy"
  },
  {
    "name": "Edson Bruno",
    "img": "https://avatars.githubusercontent.com/u/32016729?s=52&v=4",
    "link": "https://github.com/brunofamiliar"
  },
  {
    "name": "Elci Junior",
    "img": "https://avatars.githubusercontent.com/u/32462908?s=52&v=4",
    "link": "https://github.com/JuniorUbarana"
  },

]

export default function Home() {
  const poppinsFont = {
    fontFamily: "Poppins"
  };
  return (
    <div className="flex flex-col">
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins"
        rel="stylesheet"
      />
      <header className="flex flex-col  w-full bg-white items-center">
        <nav className="flex w-full max-w-5xl space-x-2 justify-between py-2 px-5 md:px-10 ">
          <div className="flex items-center space-x-1 text-gray-800">
            <CgTab className="w-6 h-6" />
            <span className="text-md font-medium hidden md:block ">
              TabNews
            </span>
          </div>

          <div className="flex space-x-2">
              <div>Acesse nossas redes:</div> 
              <SiYoutube className="w-6 h-6 mr-1 text-red-500" /> 
              <AiFillGithub className="w-6 h-6 mr-1 text-black-500" />
          </div>
        </nav>
      </header>
      <section className="flex flex-col  w-full bg-white items-center  ">
        <div className="text-4xl flex-col w-full justify-center max-w-5xl pt-6 2xl:pt-8 pb-4 px-2">
          <h1 style={poppinsFont} className="text-center flex-row font-medium  pt-2 2xl:pt-4">Uma nova experiência está em construção</h1>
          <div style={poppinsFont} className="text-center flex-row  text-base  pt-2 2xl:pt-4">Não fique de fora dessa, informe seu e-mail no campo abaixo e seja notificado assim que realizarmos o lançamento.</div>
          <div className="flex w-full justify-center pt-2 2xl:pt-4">
            <form style={poppinsFont} className="text-center self-center flex  text-base  py-2 px-2 pl-4  border max-w-md rounded-full" >
              <input className="flex-1 w-auto m-l" type="text"  placeholder="Digite seu e-mail..." />
              <button className="flex-1 bg-blue-500 text-white px-6 py-2 rounded-full" type="submit">Enviar</button>
            </form>
          </div>
          <h1 style={poppinsFont} className="text-center text-blue-400 flex-row font-medium  pt-6 pb-0">Open Source À Vista 👀</h1>
         
        </div>
        <div style={{backgroundImage: "url(" +  teclado.src + ")"}} className="w-full flex flex-col p-6  w-full items-center">
        <div className="text-4xl flex-col w-full justify-center max-w-5xl pt-2 xl:pt-2 2xl:pt-6 px-2 ">
          <div style={poppinsFont} className="flex-row  text-center text-2xl">Criado por uma comunidade amante de tecnologia e boa informação</div>
          </div>
          <div className="max-w-5xl m-auto mt-5 px-0 flex flex-wrap justify-between w-full ">
            {members.map(
              ({ nome, img, link }, index) => (
                <Members
                  key={img}
                  nome={nome}
                  img={img}
                  link={link}
                />
              )
            )}
            </div>
            <div className="max-w-5xl justify-center w-full flex flex-wrap m-4">
              <div className="rounded-full justify-center m-2 w-3 h-3 border-solid border-2 border-black"></div>
              <div className="rounded-full justify-center  m-2 w-3 h-3 border-solid border-2 border-black"></div>
              <div className="rounded-full justify-center  m-2 bg-black w-3 h-3 border-2 border-black"></div>
              <div className="rounded-full justify-center  m-2 w-3 h-3 border-solid border-2 border-black"></div>
            </div>
        </div>
      </section>

    </div>
  );
}

const Members = ({ nome, img, link}) => {
  return (
    <a href={link} target="_blank">
      <img src={img} title={nome} alt={nome} className="rounded-full  justify-between m-2 shadow-xl" />    
    </a>
  );
};
