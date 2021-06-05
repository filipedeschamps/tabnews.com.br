import { useCallback, useEffect, useState } from "react";

export default function useWindowConstraints() {
  const [windowSize, setWindowSize] = useState([0, 0]);
  const [scroll, setScroll] = useState([0, 0]);

  const changeSize = useCallback(() => {
    setWindowSize([window.innerWidth, window.innerHeight]);
  }, []);

  const changeScroll = useCallback(() => {
    setScroll([window.scrollX, window.scrollY]);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", changeSize);
    window.addEventListener("scroll", changeScroll);
    changeSize();
    changeScroll();

    return () => {
      window.removeEventListener("resize", changeSize);
      window.removeEventListener("scroll", changeScroll);
    };
  }, [changeSize, changeScroll]);

  return {
    width: windowSize[0],
    height: windowSize[1],
    scrollX: scroll[0],
    scrollY: scroll[1],
  };
}
