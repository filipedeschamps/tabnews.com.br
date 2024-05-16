import styled from 'styled-components';

const Button = styled.button`
  padding: 0;
  border: 0;
  margin: 0;
  display: inline-flex;
  padding: 0;
  border: 0;
  appearance: none;
  background: none;
  cursor: pointer;
  text-align: start;
  font: inherit;
  color: inherit;
  align-items: center;

  &::-moz-focus-inner {
    border: 0;
  }
`;

export { Button };
