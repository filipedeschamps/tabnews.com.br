import Head from "next/head";
import Image from "next/image";
import Confetti from "react-confetti";
import { useState, useEffect } from "react";

import { CgTab } from "react-icons/cg";
import collaborators from "./init/collaborators.json";

export default function Page() {
  const [shuffledCollaborators, setShuffledCollaborators] = useState([]);
  const [confettiWidth, setConfettiWidth] = useState(0);
  const [confettiHeight, setConfettiHeight] = useState(0);
  const [displayUserName, setDisplayUserName] = useState({});

  useEffect(() => {
    setShuffledCollaborators(shuffle(collaborators));

    function handleResize() {
      setConfettiWidth(window.screen.width);
      setConfettiHeight(window.screen.height);
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <style>{`
        body {
          overflow-x: hidden;
        }
        .avatar {
         transition: all .2s ease-in-out; 
         position: relative;
         }
         
        .avatar:hover {
         -moz-transform: scale(2.2);
         -webkit-transform: scale(2.2);
         transform: scale(2.2);
         z-index: 100;
        }

        .avatar:hover img {
         display: block;
         margin-left: auto;
         margin-right: auto 
        }

        .label-username{
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          background-color: #4169E1 !important;
          bottom: -1rem;
          height: 1rem;
        }

        .label-username span{
          color: #fff;
          font-size: 0.3rem;
        }
      `}</style>
      <Head>
        <title>TabNews: Onde tudo começou ("git init")</title>
        <meta
          name="description"
          content="Estamos neste exato momento construindo um novo local na internet para quem trabalha com tecnologia e precisa consumir conteúdos com valor concreto."
        ></meta>
      </Head>

      <Confetti
        width={confettiWidth}
        height={confettiHeight}
        recycle={false}
        numberOfPieces={800}
        tweenDuration={15000}
        gravity={0.15}
      />

      <div className="mt-6 mb-6">
        <div className="max-w-5xl m-auto text-center">
          <div className="flex items-center space-x-1 text-gray-800 justify-center">
            <CgTab className="w-6 h-6" />
            <h1 className="text-gray-800 text-xl font-bold">TabNews</h1>
          </div>

          <div className="text-gray-700 text-base mt-6 pl-4 pr-4">
            Estamos neste exato momento construindo um novo local na internet
            para quem <strong>trabalha com tecnologia</strong> e precisa
            consumir conteúdos com <strong>valor concreto</strong>. Somos
            pessoas brutalmente exatas e empáticas,{" "}
            <strong>simultaneamente</strong>, onde o termômetro para entender se
            isso está sendo aplicado é simples: as pessoas estão se{" "}
            <strong>afastando</strong> ou se <strong>aproximando</strong>? As{" "}
            <strong>{collaborators.length}</strong> pessoas listadas abaixo se
            aproximaram no <strong>Dia 0</strong> deste projeto para apoiar a
            sua criação, inclusive colocando a mão na massa:
          </div>
        </div>

        <div className="collaborators-grid mt-6">
          {shuffledCollaborators.map((username) => {
            const collaboratorAvatar = require(`./init/avatars/${username}.jpg`);
            return (
              <div
                key={username}
                className="avatar"
                onMouseEnter={() => setDisplayUserName({ username })}
                onMouseLeave={() => setDisplayUserName({ username })}
              >
                <a
                  href={`https://github.com/${username}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image
                    src={collaboratorAvatar}
                    alt={`Colaborador ${username}`}
                  />
                </a>
                {displayUserName.username === username && (
                  <div className="label-username">
                    <span> @{username} </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="max-w-4xl m-auto text-center text-gray-700 mt-6 pl-4 pr-4">
          Esta página é um arquivo histórico e foi publicada em{" "}
          <strong>25 de Junho de 2021</strong>.
        </div>
      </div>
      <style jsx>{`
        .collaborators-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          grid-gap: 0.25rem;
          padding: 0.25rem;
          line-height: 0;
        }

        @media (min-width: 640px) {
            .collaborators-grid {
                grid-template-columns: repeat(8, minmax(0, 1fr));
            }

        @media (min-width: 1024px) {
            .collaborators-grid {
                grid-template-columns: repeat(16, minmax(0, 1fr));
            }

        @media (min-width: 1280px) {
            .collaborators-grid {
                grid-template-columns: repeat(25, minmax(0, 1fr));
            }
      `}</style>
    </>
  );
}

function shuffle(arr) {
  const newArr = arr.slice();
  for (let i = newArr.length - 1; i > 0; i--) {
    const rand = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[rand]] = [newArr[rand], newArr[i]];
  }
  return newArr;
}
