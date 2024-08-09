import { render } from '@testing-library/react';

import webserver from 'infra/webserver';
import Pagination from 'pages/interface/components/Pagination';

describe('Pagination', () => {
  it('should not render links if there is no previous or next page', () => {
    const { getByText } = render(<Pagination basePath="/pagina" />);
    expect(getByText('Anterior')).not.toHaveProperty('href');
    expect(getByText('Próximo')).not.toHaveProperty('href');
  });

  it('should not render a link to previous page if there is no previous page', () => {
    const { getByText } = render(<Pagination basePath="/pagina" nextPage="2" />);
    expect(getByText('Anterior')).not.toHaveProperty('href');
    expect(getByText('Próximo')).toHaveProperty('href', `${webserver.host}/pagina/2`);
  });

  it('should not render a link to next page if there is no next page', () => {
    const { getByText } = render(<Pagination basePath="/conteudos" previousPage="7" />);
    expect(getByText('Anterior')).toHaveProperty('href', `${webserver.host}/conteudos/7`);
    expect(getByText('Próximo')).not.toHaveProperty('href');
  });

  it('should render a link to previous and next pages', () => {
    const { getByText } = render(<Pagination basePath="/recentes/comentarios" previousPage="1" nextPage="3" />);
    expect(getByText('Anterior')).toHaveProperty('href', `${webserver.host}/recentes/comentarios/1`);
    expect(getByText('Próximo')).toHaveProperty('href', `${webserver.host}/recentes/comentarios/3`);
  });
});
