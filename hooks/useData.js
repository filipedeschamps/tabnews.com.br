import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const DataContext = createContext({})

const DataProvider = ({ children }) => {
  const newsData = [
    {
      coins: "1132",
      author: "gustavodeschamps",
      title: "STF teria sofrido ataque hacker",
      date: "45 minutos atrás",
      comment:
        "Já vivenciei situações assim, e o caos se instala ou não conforme o poder de alinhamento que o líder tem. Agora, algo que não se pode negligenciar é o nível de ego presente nas pessoas, pois isso atrapalha muito!",
    },
    {
      coins: "954",
      author: "filipedeschamps",
      title:
        "WhatsApp volta atrás e não vai mais desativar contas que não aceitarem nova política de privacidade",
      date: "2 horas atrás",
      comment:
        "O que eu fico feliz com toda essa história é que quem está tocando essas mudanças dentro do Facebook não poderia esperar uma rejeição tão grande.",
    },
    {
      coins: "430",
      author: "arenata",
      title:
        "Reações nucleares estão sendo reativadas novamente em Chernobyl, 35 anos após acidente",
      date: "1 minuto atrás",
    },
    {
      coins: "122",
      author: "gustavodeschamps",
      title: "Alerta para golpe do WhatsApp voltado ao Dia das Mães",
      date: "4 horas atrás",
      comment: "Eu recebi um desses golpes, olha só essa imagem:",
    },
    {
      coins: "59",
      author: "gustavodeschamps",
      title:
        "Supermercado na Polônia vai testar IA para reduzir desperdício de alimentos",
      date: "40 minutos atrás",
      comment:
        "Toda ferramenta pode ser usada para o mal e para o bem, e nesse caso, para o bem.",
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
      coins: "944",
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
  ]

  return (
    <DataContext.Provider value={{ newsData }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}

export default DataProvider