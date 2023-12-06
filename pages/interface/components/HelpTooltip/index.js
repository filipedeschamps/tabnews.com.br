import { IconButton, Tooltip } from '@/TabNewsUI';
import { QuestionIcon } from '@/TabNewsUI/icons';

export default function HelpTooltip({ helpText }) {
  return (
    <Tooltip aria-label={helpText} direction="n" noDelay onFocus={(event) => event.target.blur()}>
      <IconButton
        type="button"
        variant="invisible"
        aria-label="Ajuda"
        icon={QuestionIcon}
        size="small"
        onClick={() => {}}
        sx={{
          mt: '2px',
        }}
      />
    </Tooltip>
  );
}
