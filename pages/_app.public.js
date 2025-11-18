/* eslint-disable import/order */
import { useEffect } from 'react';
import { RevalidateProvider } from 'next-swr';
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
  // Injeta anchors em headings (h1..h6[id]) no cliente.
  useEffect(() => {
    try {
      const STYLE_ID = 'tn-anchor-inject-style';
      if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
/* anchor inject - estilos mínimos e acessíveis */
/* cor preta para o ícone por padrão; usa currentColor no SVG */
.tn-anchor-link{display:inline-flex;align-items:center;justify-content:center;margin-left:.5rem;color:#000 !important;text-decoration:none;width:1.15em;height:1.15em;vertical-align:middle;opacity:1 !important;visibility:visible !important;transition:transform .12s ease,color .12s ease,opacity .12s ease;cursor:pointer}
.tn-anchor-link .tn-anchor-svg,.tn-anchor-check,.tn-anchor-img{width:100%;height:100%;display:block;pointer-events:none}
.tn-anchor-link:focus{outline:3px solid Highlight;outline-offset:3px;border-radius:4px}
.tn-anchor-link.tn-anchor-copied{transform:scale(1.08);color:#16a34a !important;opacity:1}
@media (max-width:520px){.tn-anchor-link{margin-left:.4rem}}
  `;
        document.head.appendChild(style);
      }

      const SELECTOR = 'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]';
      const cleanups = [];
      let debounceTimer = null;

      const globalSelector = (typeof window !== 'undefined' && window.__TN_ANCHOR_CONTAINER_SELECTOR) || null;
      const defaultSelector = 'main';
      const containerSelector = globalSelector || defaultSelector;
      let containerElement = document.querySelector(containerSelector);
      if (!containerElement) {
        // não encontrou o container — usar document.body como fallback para garantir
        // que a injeção funcione por padrão. Se preferir falhar silenciosamente,
        // defina window.__TN_ANCHOR_CONTAINER_SELECTOR antes do useEffect.
        containerElement = document.body;
      }

      const addAnchors = () => {
        // processa headings atuais dentro do container e adiciona anchors apenas quando necessário
        const headingsNow = Array.from(containerElement.querySelectorAll(SELECTOR));
        headingsNow.forEach((heading) => {
          if (!(heading instanceof HTMLElement)) return;
          const rawId = heading.getAttribute && heading.getAttribute('id');
          if (rawId == null) return;
          const id = String(rawId).trim();
          if (!id) return;

          const a = document.createElement('a');
          a.className = 'tn-anchor-link';
          a.setAttribute('aria-label', 'Copiar link da seção');
          a.setAttribute('href', `#${id}`);
          a.setAttribute('role', 'button');
          a.tabIndex = 0;

          const iconUrl = (typeof window !== 'undefined' && window.__TN_ANCHOR_ICON_URL) || null;
          // se já existir uma âncora antiga, remova-a para garantir listeners "frescos"
          const existing = heading.querySelector('.tn-anchor-link');
          if (existing) {
            try {
              // se tiver função de cleanup anexada, chame-a
              if (existing.__tn_cleanup && typeof existing.__tn_cleanup === 'function') {
                try {
                  existing.__tn_cleanup();
                } catch (e) {
                  /* ignore */
                }
              }
            } catch (e) {
              /* ignore */
            }
            try {
              existing.remove();
            } catch (e) {
              /* ignore */
            }
          }

          if (iconUrl) {
            const img = document.createElement('img');
            img.className = 'tn-anchor-img';
            img.src = iconUrl;
            img.alt = '';
            img.setAttribute('aria-hidden', 'true');
            img.width = 18;
            img.height = 18;
            a.appendChild(img);
          } else {
            a.innerHTML = `
              <svg class="tn-anchor-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path d="M10.59 13.41a3 3 0 0 1 0-4.24l1.41-1.41a3 3 0 0 1 4.24 4.24l-1.41 1.41" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <path d="M13.41 10.59a3 3 0 0 1 0 4.24l-1.41 1.41a3 3 0 0 1-4.24-4.24l1.41-1.41" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
            `;
          }

          const clickHandler = async (ev) => {
            try {
              ev.preventDefault();
              ev.stopPropagation();
            } catch (e) {
              /* ignore */
            }
            const url = `${window.location.origin}${window.location.pathname}#${id}`;

            const showCopied = () => {
              const prevContent = a.innerHTML;
              const prevImg = a.querySelector('.tn-anchor-img');
              a.innerHTML = `
                <svg class="tn-anchor-check" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
              `;
              a.classList.add('tn-anchor-copied');
              setTimeout(() => {
                a.classList.remove('tn-anchor-copied');
                if (prevImg && iconUrl) {
                  a.innerHTML = '';
                  const img = document.createElement('img');
                  img.className = 'tn-anchor-img';
                  img.src = iconUrl;
                  img.alt = '';
                  img.setAttribute('aria-hidden', 'true');
                  img.width = 18;
                  img.height = 18;
                  a.appendChild(img);
                } else {
                  a.innerHTML = prevContent;
                }
              }, 1400);
            };

            try {
              if (navigator.share) {
                await navigator.share({ title: document.title || heading.textContent || '', url });
                showCopied();
                return;
              }
            } catch (err) {
              // share falhou/cancelado -> seguir para clipboard
            }

            try {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
                showCopied();
                return;
              }
            } catch (err) {
              // clipboard falhou
            }

            // Prompt removed to preserve smooth UX; no blocking popup.
            try {
              console.warn('Clipboard and Web Share unavailable; link fallback skipped');
            } catch (err) {
              /* ignore */
            }
          };

          const keyHandler = (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault();
              clickHandler(ev);
            }
          };

          a.addEventListener('click', clickHandler);
          a.addEventListener('keydown', keyHandler);

          const cleanupFn = () => {
            try {
              a.removeEventListener('click', clickHandler);
            } catch (e) {
              /* ignore */
            }
            try {
              a.removeEventListener('keydown', keyHandler);
            } catch (e) {
              /* ignore */
            }
            try {
              if (a.parentNode) a.parentNode.removeChild(a);
            } catch (e) {
              /* ignore */
            }
            try {
              delete a.__tn_cleanup;
            } catch (e) {
              /* ignore */
            }
          };

          // anexe a função de cleanup no elemento para permitir remoção quando re-criado
          try {
            a.__tn_cleanup = cleanupFn;
          } catch (e) {
            /* ignore */
          }

          cleanups.push(cleanupFn);

          heading.appendChild(a);
        });
      };

      // run once initially
      addAnchors();

      // observe DOM changes to detect headings added/updated (limitado ao container)
      const observer = new MutationObserver((mutations) => {
        // ignore mutations that occur inside our own anchor elements to avoid
        // feedback loops where updating the icon retriggers addAnchors().
        let relevant = false;
        for (const m of mutations) {
          // if attribute change on an element that is inside an anchor, ignore
          const tgt = m.target instanceof Element ? m.target : null;
          if (tgt && tgt.closest && tgt.closest('.tn-anchor-link')) continue;
          if (tgt && tgt.hasAttribute && tgt.hasAttribute('data-tn-ignore-observer')) continue;

          if (m.type === 'childList' && m.addedNodes && m.addedNodes.length) {
            // check added nodes: ignore if they are inside an existing anchor
            let anyOutside = false;
            for (const n of m.addedNodes) {
              if (!(n instanceof Element)) {
                anyOutside = true;
                break;
              }
              if (n.closest && n.closest('.tn-anchor-link')) continue;
              if (n.hasAttribute && n.hasAttribute('data-tn-ignore-observer')) continue;
              anyOutside = true;
              break;
            }
            if (anyOutside) {
              relevant = true;
              break;
            }
          }

          if (m.type === 'attributes' && m.attributeName === 'id') {
            relevant = true;
            break;
          }
        }
        if (!relevant) return;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          addAnchors();
        }, 120);
      });

      observer.observe(containerElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['id'] });

      return () => {
        try {
          observer.disconnect();
        } catch (e) {
          /* ignore */
        }
        try {
          if (debounceTimer) clearTimeout(debounceTimer);
        } catch (e) {
          /* ignore */
        }
        try {
          cleanups.forEach((fn) => fn());
        } catch (e) {
          /* ignore */
        }
      };
    } catch (err) {
      // segurança: não quebrou o app se algo falhar
      // console.error('Anchor injector error', err);
    }
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
