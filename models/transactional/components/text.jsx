import { Text as ReactEmailText } from 'react-email';

export const Text = ({ children, style }) => {
  return <ReactEmailText style={{ ...defaultStyle, ...style }}>{children}</ReactEmailText>;
};

const defaultStyle = {
  color: '#333',
  fontSize: '14px',
};
