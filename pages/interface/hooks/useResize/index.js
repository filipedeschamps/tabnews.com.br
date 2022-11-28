export default function useResize() {
  const initialWidthScreen = document.body.clientWidth;
  const initialHeightScreen = document.body.clientWidth;
  const [width, setWidth] = useState(initialWidthScreen);
  const [height, setHeight] = useState(initialHeightScreen);

  const handleResize = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerWidth;
    setWidth(screenWidth);
    setHeight(screenHeight);
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return {
    width,
    height,
  };
}
