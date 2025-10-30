import { RevalidateProvider } from 'next-swr';
import { useEffect } from 'react';
import { SWRConfig } from 'swr';
import '@tabnews/ui/css';

import { ThemeProvider, Turnstile } from '@/TabNewsUI';
import { Analytics, DefaultHead, UserProvider } from 'pages/interface';

async function SWRFetcher(resource, init) {
  const response = await fetch(resource, init);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const responseBody = await response.json();

  return { body: responseBody, headers: response.headers };
}

const fallbackData = { body: null, headers: {} };

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem('scrollPos', window.scrollY);
      console.warn('Posição do Scroll SALVA:', window.scrollY);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Restaura posição do scroll apenas se a navegação atual for um reload.
    // Usa Navigation Timing API com fallback para performance.navigation.
    try {
      let isReload = false;
      if (performance && typeof performance.getEntriesByType === 'function') {
        const nav = performance.getEntriesByType('navigation')[0];
        if (nav && nav.type === 'reload') isReload = true;
      }

      if (!isReload && performance && performance.navigation) {
        if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
          isReload = true;
        }
      }

      if (isReload) {
        const savedPos = sessionStorage.getItem('scrollPos');
        if (savedPos) {
          //   usei requestAnimationFrame para tentar aplicar o scroll repetidamente até que a altura da página permita rolar para a posição desejada ou até um timeout.
          const target = parseInt(savedPos, 10) || 0;
          const maxMs = 2000; // tempo máximo de tentativas
          const start = performance && performance.now ? performance.now() : Date.now();

          const tryOnce = () => {
            // tenta rolar uma vez
            window.scrollTo(0, target);
            // Se já estamos na posição desejada, fim.
            if (window.scrollY === target) return true;

            // Segunda tentativa novamente no próximo frame
            const height = document.documentElement.scrollHeight || document.body.scrollHeight;
            const canReach = height >= target + (window.innerHeight || 0);
            return canReach;
          };

          const step = () => {
            try {
              const now = performance && performance.now ? performance.now() : Date.now();
              // Se tryOnce indica que já rolou ou que a página tem altura para rolar, executa o scroll uma vez mais e finaliza.
              if (tryOnce()) {
                // Garante remoção do valor
                try {
                  sessionStorage.removeItem('scrollPos');
                } catch (e) {
                  void 0;
                }
                return;
              }

              if (now - start < maxMs) {
                requestAnimationFrame(step);
              } else {
                // timeout: faz uma última tentativa e remove o valor salvo
                try {
                  window.scrollTo(0, target);
                } catch (e) {
                  void 0;
                }
                try {
                  sessionStorage.removeItem('scrollPos');
                } catch (e) {
                  void 0;
                }
              }
            } catch (e) {
              // Remove savedPos para não tentar sempre
              try {
                sessionStorage.removeItem('scrollPos');
              } catch (err) {
                void 0;
              }
            }
          };

          // Inicia tentativas no próximo frame
          requestAnimationFrame(step);
        }
      }
    } catch (e) {
      // Se não estiver disponível, seguir sem restauração
      void 0;
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  return (
    <ThemeProvider>
      <Turnstile />
      <UserProvider>
        <DefaultHead />
        <SWRConfig value={{ fetcher: SWRFetcher, fallbackData }}>
          <RevalidateProvider swr={{ swrPath: '/api/v1/swr', ...pageProps.swr }}>
            <Component {...pageProps} />
          </RevalidateProvider>
        </SWRConfig>
        <Analytics />
      </UserProvider>
    </ThemeProvider>
  );
}

export default MyApp;
