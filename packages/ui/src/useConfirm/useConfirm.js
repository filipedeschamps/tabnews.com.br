'use client';
import { useConfirm as usePrimerConfirm } from '@primer/react';

import { translateDialogCloseTooltip } from '../Dialog/closeTooltip';

const defaultOptions = {
  cancelButtonContent: 'Cancelar',
  confirmButtonContent: 'Sim',
};

// The dialog of `useConfirm` is mounted in its own root outside the React tree, so the close tooltip
// only exists after that root paints — hence the observer instead of an effect.
function translateCloseTooltipWhenRendered() {
  const observer = new MutationObserver(() => {
    if (translateDialogCloseTooltip()) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return () => observer.disconnect();
}

export function useConfirm() {
  const confirm = usePrimerConfirm();

  return function confirmInPortuguese(options) {
    const confirmation = confirm({ ...defaultOptions, ...options });
    const stopObserving = translateCloseTooltipWhenRendered();

    return confirmation.finally(stopObserving);
  };
}
