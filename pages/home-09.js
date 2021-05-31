import Link from "next/link";
import { CgTab } from "react-icons/cg";
import { IoChatbox } from "react-icons/io5";
import { BsArrowReturnRight } from "react-icons/bs";
import { FaStar } from "react-icons/fa";
import { VscCircleFilled } from "react-icons/vsc";
import { MdStars } from "react-icons/md";
import { MdAccountCircle } from "react-icons/md";
import { MdMonetizationOn } from "react-icons/md";
import { RiMoneyDollarCircleFill } from "react-icons/ri";

import { username } from "react-lorem-ipsum";
import { LoremIpsum } from "lorem-ipsum";
import { Header } from '../components/Header'
import { NewsList } from '../components/NewsList'


export default function Home() {
  return (
    <div className="dark:bg-darkTheme-background">
      <div className="pl-3 pr-3 max-w-5xl m-auto">
        <Header />

        <div className="m-auto">
          <NewsList />
        </div>
      </div>
    </div>
  );
}