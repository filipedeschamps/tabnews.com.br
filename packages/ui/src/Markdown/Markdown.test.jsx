import { render } from '@testing-library/react';

import { MarkdownViewer } from './Markdown';

const viewerValues = [];

vi.mock('@bytemd/react', () => ({
  Editor: vi.fn(() => null),
  Viewer: vi.fn(({ value }) => {
    viewerValues.push(value);
    return <div data-testid="markdown-viewer">{value}</div>;
  }),
}));

vi.mock('@primer/react', async (importOriginal) => ({
  ...(await importOriginal()),
  useTheme: vi.fn(() => ({ colorScheme: 'light' })),
}));

describe('MarkdownViewer', () => {
  beforeEach(() => {
    viewerValues.length = 0;
  });

  it('does not force a temporary value update on first render', async () => {
    const markdown = `$$
\\begin{array}{r}
  1010 \\\\
+ 0011 \\\\
\\hline
  1101
\\end{array}
$$`;

    render(<MarkdownViewer value={markdown} />);

    await new Promise((resolve) => setTimeout(resolve));

    expect(viewerValues).not.toContain(`${markdown}\n\u0160`);
  });
});
