import { Link as ReactEmailLink } from '@react-email/components';

import { Text } from './text';

export const Link = ({ children, style, ...props }) => {
  return (
    <ReactEmailLink style={{ ...linkStyle, ...style }} {...props}>
      {children}
    </ReactEmailLink>
  );
};

export const LinkText = ({ children, style }) => {
  return (
    <div style={style}>
      <Text style={textStyle}>
        Se você não conseguir clicar no link, copie e cole o endereço abaixo no seu navegador:
      </Text>

      <code style={linkTextStyle}>{children}</code>
    </div>
  );
};

const linkStyle = {
  color: '#2754C5',
  fontSize: '14px',
  textDecoration: 'underline',
  display: 'block',
};

const textStyle = {
  margin: '24px 0',
};

const linkTextStyle = {
  backgroundColor: '#f3f3f3',
  color: '#333',
  display: 'block',
  fontSize: '14px',
  padding: '12px',
  borderRadius: '8px',
  wordBreak: 'break-all',
};
