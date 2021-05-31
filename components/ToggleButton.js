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
import { useEffect, useState, useCallback } from "react";
import {useTheme} from '../hooks/themeModeProvider'

export function ToggleButton() {
  const {isDarkModeOn, handleDarkModeChange} = useTheme()

  return (
    <button className="border border-gray-300 dark:border-darkTheme-secondary text-gray-700 focus:outline-none px-4 rounded-lg dark:text-darkTheme-primary" type="button" onClick={()=>{handleDarkModeChange()}}>
      {isDarkModeOn ? "Desligar Dark Mode" : "Ligar Dark Mode"}
    </button>
  );
}