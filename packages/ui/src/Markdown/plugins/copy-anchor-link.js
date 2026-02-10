const linkIcon =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M10.59 13.41a3 3 0 0 1 0-4.24l1.41-1.41a3 3 0 0 1 4.24 4.24l-1.41 1.41" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M13.41 10.59a3 3 0 0 1 0 4.24l-1.41 1.41a3 3 0 0 1-4.24-4.24l1.41-1.41" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

const checkIcon =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M20 4.5L9 15.5l-5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

const errorIcon =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M18 3L6 15M6 3l12 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

const HEADING_SELECTOR = 'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]';
const FEEDBACK_DURATION_MS = 1_400;

/**
 * Plugin to add anchor link copy buttons to headings.
 *
 * @returns {import('bytemd').BytemdPlugin}
 */
export function copyAnchorLinkPlugin() {
  function showFeedbackState(buttonElement, icon, className) {
    const prevContent = buttonElement.innerHTML;
    buttonElement.innerHTML = `<span>${icon}</span>`;
    buttonElement.classList.add(className);
    buttonElement.disabled = true;

    setTimeout(() => {
      buttonElement.classList.remove(className);
      buttonElement.innerHTML = prevContent;
      buttonElement.disabled = false;
    }, FEEDBACK_DURATION_MS);
  }

  function createAnchorButton(heading, headingId) {
    const buttonElement = document.createElement('button');

    buttonElement.setAttribute('type', 'button');
    buttonElement.className = 'tn-anchor-link';
    buttonElement.setAttribute('aria-label', 'Copiar link da seção');
    buttonElement.innerHTML = `<span>${linkIcon}</span>`;

    buttonElement.onclick = async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      const url = `${window.location.origin}${window.location.pathname}#${headingId}`;

      try {
        if ('ontouchstart' in window && navigator.share) {
          await navigator.share({ title: document.title || heading.textContent || '', url });
          showFeedbackState(buttonElement, checkIcon, 'tn-anchor-copied');
          return;
        }
      } catch {
        // share failed/cancelled -> fall through to clipboard
      }

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          showFeedbackState(buttonElement, checkIcon, 'tn-anchor-copied');
          return;
        }
      } catch {
        // clipboard failed
      }

      showFeedbackState(buttonElement, errorIcon, 'tn-anchor-error');
    };

    return buttonElement;
  }

  return {
    viewerEffect({ markdownBody }) {
      const headings = markdownBody.querySelectorAll(HEADING_SELECTOR);

      if (headings.length === 0) return;

      headings.forEach((heading) => {
        const headingId = heading.getAttribute('id');
        if (!headingId?.trim()) return;

        if (heading.dataset.anchorInjected) return;

        heading.appendChild(createAnchorButton(heading, headingId.trim()));
        heading.dataset.anchorInjected = 'true';
      });
    },
  };
}
