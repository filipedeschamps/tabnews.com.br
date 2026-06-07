import { clsx } from 'clsx';

import classes from './index.module.css';

export default function CharacterCount({ maxLength, value }) {
  const exceeded = value.length > maxLength;

  return (
    <span className={clsx(classes.Text, exceeded && classes.Exceeded)}>
      {value.length}/{maxLength}
    </span>
  );
}
