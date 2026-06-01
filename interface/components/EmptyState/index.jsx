import { Button, Heading } from '@/TabNewsUI';
import { PlusIcon } from '@/TabNewsUI/icons';

import classes from './index.module.css';

export default function EmptyState(props) {
  const { title, description, action, icon: Icon, isLoading } = props;
  if (isLoading) return null;
  return (
    <div className={classes.Wrapper}>
      {Icon && <Icon size={40} className={classes.Icon} />}
      <Heading className={classes.Title}>{title}</Heading>
      {description && <span>{description}</span>}
      {action && (
        <Button className={classes.Action} leadingVisual={PlusIcon} onClick={action.onClick}>
          {action.text}
        </Button>
      )}
    </div>
  );
}
