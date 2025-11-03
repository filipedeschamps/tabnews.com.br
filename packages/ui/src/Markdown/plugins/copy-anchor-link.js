const linkIcon =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M10.59 13.41a3 3 0 0 1 0-4.24l1.41-1.41a3 3 0 0 1 4.24 4.24l-1.41 1.41" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M13.41 10.59a3 3 0 0 1 0 4.24l-1.41 1.41a3 3 0 0 1-4.24-4.24l1.41-1.41" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

const checkIcon =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

// Tamanhos de ícone escalados por nível de heading (em 'em' para acompanhar o tamanho do texto)
const defaultIconSizes = {
  h1: '0.65em',
  h2: '0.65em',
  h3: '0.7em',
  h4: '0.75em',
  h5: '0.8em',
  h6: '0.85em',
};

/**
 * Plugin para adicionar botões de cópia de link de âncora em headings.
 *
 * @param {Object} options
 * @param {number} [options.maxLevel=5] - Nível máximo de heading a processar (1-6). Default: 5 (h1-h5)
 * @param {Object} [options.iconSizes] - Tamanhos customizados dos ícones por nível (ex: { h1: '0.6em', h2: '0.65em' })
 * @returns {import('bytemd').BytemdPlugin}
 */
export function copyAnchorLinkPlugin(options = {}) {
  const { maxLevel = 5, iconSizes: customIconSizes = {} } = options;
  const iconSizes = { ...defaultIconSizes, ...customIconSizes };

  function createAnchorButton(heading, headingId) {
    const tagName = heading.tagName.toLowerCase();
    const headingLevel = parseInt(tagName.charAt(1), 10);

    // Respeitar o nível máximo configurado
    if (headingLevel > maxLevel) return null;

    const buttonElement = document.createElement('a');
    const iconSize = iconSizes[tagName] || '0.75em';

    buttonElement.className = 'tn-anchor-link';
    buttonElement.setAttribute('href', `#${headingId}`);
    buttonElement.setAttribute('role', 'button');
    buttonElement.setAttribute('aria-label', 'Copiar link da seção');
    buttonElement.tabIndex = 0;

    setStyleProperties(buttonElement, {
      display: 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      'margin-left': '0.4em',
      color: 'var(--fgColor-muted, #656d76)',
      'text-decoration': 'none',
      width: iconSize,
      height: iconSize,
      'vertical-align': 'middle',
      opacity: '0.7',
      transition: 'transform 0.12s ease, color 0.12s ease, opacity 0.12s ease',
      cursor: 'pointer',
    });

    buttonElement.innerHTML = createIconHtml(iconSize);

    buttonElement.addEventListener('mouseenter', () => {
      buttonElement.style.opacity = '1';
    });

    buttonElement.addEventListener('mouseleave', () => {
      if (!buttonElement.classList.contains('tn-anchor-copied')) {
        buttonElement.style.opacity = '0.7';
      }
    });

    const handleCopy = async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      const url = `${window.location.origin}${window.location.pathname}#${headingId}`;

      // Tentar Web Share API primeiro (mobile-friendly)
      try {
        if (navigator.share) {
          await navigator.share({ title: document.title || heading.textContent || '', url });
          showCopiedState(buttonElement, iconSize);
          return;
        }
      } catch {
        // share falhou/cancelado -> seguir para clipboard
      }

      // Fallback para Clipboard API
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          showCopiedState(buttonElement, iconSize);
          return;
        }
      } catch {
        // clipboard falhou
      }

      console.warn('Clipboard and Web Share unavailable');
    };

    const handleKeydown = (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        handleCopy(ev);
      }
    };

    buttonElement.addEventListener('click', handleCopy);
    buttonElement.addEventListener('keydown', handleKeydown);

    // Armazenar cleanup para remoção posterior
    buttonElement.__tn_cleanup = () => {
      buttonElement.removeEventListener('click', handleCopy);
      buttonElement.removeEventListener('keydown', handleKeydown);
      buttonElement.removeEventListener('mouseenter', () => {});
      buttonElement.removeEventListener('mouseleave', () => {});
    };

    return buttonElement;
  }

  function createIconHtml(size) {
    return `<span style="width:${size};height:${size};display:block;pointer-events:none">${linkIcon}</span>`;
  }

  function createCheckIconHtml(size) {
    return `<span style="width:${size};height:${size};display:block;pointer-events:none">${checkIcon}</span>`;
  }

  function showCopiedState(buttonElement, iconSize) {
    const prevContent = buttonElement.innerHTML;
    buttonElement.innerHTML = createCheckIconHtml(iconSize);
    buttonElement.classList.add('tn-anchor-copied');
    setStyleProperties(buttonElement, {
      transform: 'scale(1.08)',
      color: '#16a34a',
      opacity: '1',
    });

    setTimeout(() => {
      buttonElement.classList.remove('tn-anchor-copied');
      buttonElement.innerHTML = prevContent;
      setStyleProperties(buttonElement, {
        transform: 'scale(1)',
        color: 'var(--fgColor-muted, #656d76)',
        opacity: '0.7',
      });
    }, 1400);
  }

  function setStyleProperties(element, styleProperties) {
    for (const styleProperty in styleProperties) {
      element.style.setProperty(styleProperty, styleProperties[styleProperty]);
    }
  }

  function buildSelector(maxLevel) {
    const levels = [];
    for (let i = 1; i <= Math.min(maxLevel, 6); i++) {
      levels.push(`h${i}[id]`);
    }
    return levels.join(', ');
  }

  return {
    viewerEffect({ markdownBody }) {
      const selector = buildSelector(maxLevel);
      const headings = markdownBody.querySelectorAll(selector);

      if (headings.length === 0) return;

      const cleanups = [];

      headings.forEach((heading) => {
        const headingId = heading.getAttribute('id');
        if (!headingId?.trim()) return;

        // Verificar se já foi injetado
        if (heading.querySelector('.tn-anchor-link')) return;

        const anchorButton = createAnchorButton(heading, headingId.trim());
        if (anchorButton) {
          heading.appendChild(anchorButton);
          cleanups.push(() => {
            if (anchorButton.__tn_cleanup) {
              anchorButton.__tn_cleanup();
            }
            anchorButton.remove();
          });
        }
      });

      // Retornar função de cleanup
      return () => {
        cleanups.forEach((fn) => fn());
      };
    },
  };
}
