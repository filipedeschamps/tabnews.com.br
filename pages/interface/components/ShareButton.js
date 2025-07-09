import { useState } from 'react';

export default function ShareButton({ title, slug }) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    const text = `${title}\nhttp://localhost/${slug}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return <button onClick={handleClick}>{copied ? 'Copiado!' : 'Compartilhar'}</button>;
}
