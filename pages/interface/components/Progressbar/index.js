// Original code from: https://github.com/apal21/nextjs-progressbar

import Router from 'next/router';
import NProgress from 'nprogress';
import { useEffect } from 'react';

export default function NextNProgress({
  color = '#29D',
  startPosition = 0.3,
  stopDelayMs = 200,
  height = 3,
  showOnShallow = true,
  options,
  nonce,
}) {
  useEffect(() => {
    let timer = null;

    if (options) {
      NProgress.configure(options);
    }

    const routeChangeStart = (_, { shallow }) => {
      if (!shallow || showOnShallow) {
        NProgress.set(startPosition);
        NProgress.start();
      }
    };

    const routeChangeEnd = (_, { shallow }) => {
      if (!shallow || showOnShallow) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          NProgress.done(true);
        }, stopDelayMs);
      }
    };

    Router.events.on('routeChangeStart', routeChangeStart);
    Router.events.on('routeChangeComplete', routeChangeEnd);
    Router.events.on('routeChangeError', routeChangeEnd);
    return () => {
      Router.events.off('routeChangeStart', routeChangeStart);
      Router.events.off('routeChangeComplete', routeChangeEnd);
      Router.events.off('routeChangeError', routeChangeEnd);
    };
  }, [options, showOnShallow, startPosition, stopDelayMs]);

  return (
    <style nonce={nonce}>{`
            #nprogress {
                pointer-events: none;
            }
            #nprogress .bar {
                background: ${color};
                position: fixed;
                z-index: 9999;
                top: 0;
                left: 0;
                width: 100%;
                height: ${height}px;
            }
            #nprogress .peg {
                display: block;
                position: absolute;
                right: 0px;
                width: 100px;
                height: 100%;
                box-shadow: 0 0 10px ${color}, 0 0 5px ${color};
                opacity: 1;
                -webkit-transform: rotate(3deg) translate(0px, -4px);
                -ms-transform: rotate(3deg) translate(0px, -4px);
                transform: rotate(3deg) translate(0px, -4px);
            }
            #nprogress .spinner {
                display: block;
                position: fixed;
                z-index: 1031;
                top: 15px;
                right: 15px;
            }
            #nprogress .spinner-icon {
                width: 18px;
                height: 18px;
                box-sizing: border-box;
                border: solid 2px transparent;
                border-top-color: ${color};
                border-left-color: ${color};
                border-radius: 50%;
                -webkit-animation: nprogresss-spinner 400ms linear infinite;
                animation: nprogress-spinner 400ms linear infinite;
            }
            .nprogress-custom-parent {
                overflow: hidden;
                position: relative;
            }
            .nprogress-custom-parent #nprogress .spinner,
            .nprogress-custom-parent #nprogress .bar {
                position: absolute;
            }
            @-webkit-keyframes nprogress-spinner {
                0% {
                -webkit-transform: rotate(0deg);
                }
                100% {
                -webkit-transform: rotate(360deg);
                }
            }
            @keyframes nprogress-spinner {
                0% {
                transform: rotate(0deg);
                }
                100% {
                transform: rotate(360deg);
                }
            }
        `}</style>
  );
}
