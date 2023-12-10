import { check, copy } from '@primer/octicons';

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
        'background-color': 'transparent',
        cursor: 'pointer',
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
      buttonElement.innerHTML = copy.toSVG();
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
      buttonElement.innerHTML = check.toSVG();
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
        const codeToCopy = codeElement.innerText;

        const externalDivElement = document.createElement('div');
        setStyleProperties(externalDivElement, {
          position: 'relative',
          top: '-6px',
          right: '-6px',
          'min-width': '32px',
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
