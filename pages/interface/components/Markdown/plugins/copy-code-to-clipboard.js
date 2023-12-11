const checkIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>';
const copyIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>';

/**
 * @returns {import('@bytemd/react').ViewerProps['plugins'][0]}
 */

export function copyCodeToClipboardPlugin() {
  function createCopyButton(parentElement, contentToCopy) {
    const buttonElement = createButtonElement();

    buttonElement.onclick = async () => {
      await navigator.clipboard.writeText(contentToCopy);
      setStateAfterCopy(buttonElement);
      setTimeout(() => setStateBeforeCopy(buttonElement), 2000);
    };

    return parentElement.appendChild(buttonElement);

    function createButtonElement() {
      const buttonElement = document.createElement('button');

      buttonElement.setAttribute('type', 'button');
      setStyleProperties(buttonElement, {
        width: '32px',
        height: '32px',
        display: 'grid',
        'place-content': 'center',
        cursor: 'pointer',
        'border-style': 'solid',
        'border-width': '1px',
        'border-radius': '6px',
        transition: '0.2s ease-in-out',
        'transition-property': 'color, background-color, border-color',
      });
      setStateBeforeCopy(buttonElement);
      buttonElement.classList.add('copy-button');

      return buttonElement;
    }

    function setStateBeforeCopy(buttonElement) {
      setAttributes(buttonElement, {
        title: 'Copiar',
        'aria-label': 'Copiar',
      });
      setStyleProperties(buttonElement, {
        'pointer-events': 'auto',
      });
      buttonElement.innerHTML = copyIcon;
      buttonElement.classList.remove('copied');
    }

    function setStateAfterCopy(buttonElement) {
      setAttributes(buttonElement, {
        title: 'Copiado',
        'aria-label': 'Copiado',
      });
      setStyleProperties(buttonElement, {
        'pointer-events': 'none',
      });
      buttonElement.innerHTML = checkIcon;
      buttonElement.classList.add('copied');
    }

    function setAttributes(buttonElement, attributes) {
      for (const attribute in attributes) {
        buttonElement.setAttribute(attribute, attributes[attribute]);
      }
    }
  }

  function setStyleProperties(element, styleProperties) {
    for (const styleProperty in styleProperties) {
      element.style.setProperty(styleProperty, styleProperties[styleProperty]);
    }
  }

  return {
    viewerEffect({ markdownBody }) {
      if (!navigator.clipboard) return;

      const codeElements = markdownBody.querySelectorAll('pre > code');

      if (codeElements.length === 0) return;

      codeElements.forEach((codeElement) => {
        if (!codeElement.innerHTML) return;

        const pre = codeElement.parentElement;
        if (pre.childElementCount > 1) return;

        const codeToCopy = codeElement.innerText;

        const externalDivElement = document.createElement('div');
        setStyleProperties(externalDivElement, {
          position: 'relative',
          top: '-6px',
          right: '-6px',
          'min-width': '32px',
        });
        setStyleProperties(pre, {
          display: 'flex',
          'justify-content': 'space-between',
          gap: '4px',
        });

        pre.appendChild(externalDivElement);

        const internalDivElement = document.createElement('div');
        internalDivElement.style.position = 'absolute';
        externalDivElement.appendChild(internalDivElement);

        createCopyButton(internalDivElement, codeToCopy);
      });
    },
  };
}
