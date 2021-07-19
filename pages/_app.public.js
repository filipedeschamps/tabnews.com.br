import "./css/globals.css";
import Head from "next/head";

function MyApp({ Component, pageProps }) {
  // TODO: Refactor font to download from our domain
  // TODO: Font declaration in "globals.css" seems wrong
  return <Component {...pageProps} />;
}

export default MyApp;
