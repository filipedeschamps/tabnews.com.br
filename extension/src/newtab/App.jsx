import React from 'react';
import Link from 'next/link'
import { CgTab, CgYoutube,  } from "react-icons/cg";
import { SiGithub } from "react-icons/si";

export default function App(){

    return(
        <div className="h-screen flex flex-col items-center justify-center relative">
            <header className="flex justify-center">
                <div className="flex items-center justify-center space-x-1 text-gray-800">
                    <CgTab className="w-10 h-10 mr-2" />
                    <span className="text-3xl font-medium">TabNews</span>
                </div>
            </header>
            <h2 className="mt-2 text-2xl font-normal">Conteúdos para quem vive de programação e tecnologia.</h2>
            <footer className="absolute left-2/5 bottom-5">
                <ul className="flex">
                    <li><Link href="https://www.youtube.com/channel/UCU5JicSrEM5A63jkJ2QvGYw"><a> <CgYoutube className="w-6 h-6 mr-4"/> </a></Link></li>
                    <li><Link href="https://github.com/filipedeschamps"><a> <SiGithub className="w-6 h-6"/> </a></Link> </li>
                </ul>
            </footer>
        </div>
    );
}