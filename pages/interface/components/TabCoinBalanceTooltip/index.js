import { Tooltip } from '@/TabNewsUI';

export default function TabCoinBalanceTooltip({ children, credit, debit, ...props }) {
  function getLabel() {
    const debitCount = Math.abs(debit);
    const total = credit + debitCount;

    if (total === 0) {
      return `Nenhum voto`;
    }

    const creditPercentage = Math.round((credit / total) * 100);
    return `+${credit} | -${debitCount} (${creditPercentage}% achou relevante)`;
  }

  return (
    <Tooltip {...props} aria-label={getLabel()}>
      {children}
    </Tooltip>
  );
}
