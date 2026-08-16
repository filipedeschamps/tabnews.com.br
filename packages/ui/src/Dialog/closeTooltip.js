// The close button of the Primer Dialog has no prop for its tooltip text, and the button itself has
// no `aria-label`: it points to the tooltip through `aria-labelledby`. Rewriting the tooltip text
// translates both the tooltip and the accessible name.
const closeTooltipSelector = '[role="dialog"] button ~ span, [role="alertdialog"] button ~ span';

export function translateDialogCloseTooltip() {
  document.querySelectorAll(closeTooltipSelector).forEach((span) => {
    if (span.textContent === 'Close') {
      span.textContent = 'Fechar';
    }
  });
}
