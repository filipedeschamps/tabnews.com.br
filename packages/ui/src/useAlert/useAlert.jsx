'use client';
import { BaseStyles } from '@primer/react';
import { createRoot } from 'react-dom/client';

import { Dialog } from '../Dialog';

// Same approach of the `useConfirm` of Primer, whose `ConfirmationDialog` always has two buttons:
// the dialog is mounted in its own root, and the promise resolves when it is dismissed.
function showAlert({ content, buttonContent = 'OK', ...dialogProps }) {
  return new Promise((resolve) => {
    const hostElement = document.createElement('div');
    document.body.append(hostElement);
    const root = createRoot(hostElement);

    function onClose() {
      root.unmount();
      hostElement.remove();
      resolve();
    }

    root.render(
      <BaseStyles>
        <Dialog
          {...dialogProps}
          role="alertdialog"
          onClose={onClose}
          footerButtons={[{ content: buttonContent, onClick: onClose, autoFocus: true }]}>
          {content}
        </Dialog>
      </BaseStyles>,
    );
  });
}

export function useAlert() {
  return showAlert;
}
