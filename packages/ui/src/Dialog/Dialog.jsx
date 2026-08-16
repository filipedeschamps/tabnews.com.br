'use client';
import { Dialog as PrimerDialog } from '@primer/react';
import { useLayoutEffect } from 'react';

import { translateDialogCloseTooltip } from './closeTooltip';

export function Dialog(props) {
  useLayoutEffect(translateDialogCloseTooltip, []);

  return <PrimerDialog {...props} />;
}
