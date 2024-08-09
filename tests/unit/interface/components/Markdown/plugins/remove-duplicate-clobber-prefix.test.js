import { removeDuplicateClobberPrefix } from 'pages/interface/components/Markdown/plugins/remove-duplicate-clobber-prefix';

describe('removeDuplicateClobberPrefix', () => {
  function usePlugin(clobberPrefix) {
    const plugin = removeDuplicateClobberPrefix({ clobberPrefix });

    const element = {
      properties: {
        id: 'custom-prefix-custom-prefix-12',
      },
      children: [
        {
          properties: {
            id: 'custom-prefix-34',
          },
          children: [
            {
              properties: {
                id: 'user-content-56',
              },
              children: [],
            },
            {
              properties: {
                id: 'user-content-user-content-78',
              },
              children: [],
            },
          ],
        },
      ],
    };

    plugin.rehype({
      use: (fn) => fn(),
    })(element);

    return element;
  }

  it('should remove duplicate default clobber prefix from id attributes', () => {
    const element = usePlugin();

    expect(element.properties.id).toBe('custom-prefix-custom-prefix-12');
    expect(element.children[0].properties.id).toBe('custom-prefix-34');
    expect(element.children[0].children[0].properties.id).toBe('user-content-56');
    expect(element.children[0].children[1].properties.id).toBe('user-content-78');
  });

  it('should remove duplicate custom prefix from id attributes', () => {
    const element = usePlugin('custom-prefix-');

    expect(element.properties.id).toBe('custom-prefix-12');
    expect(element.children[0].properties.id).toBe('custom-prefix-34');
    expect(element.children[0].children[0].properties.id).toBe('user-content-56');
    expect(element.children[0].children[1].properties.id).toBe('user-content-user-content-78');
  });
});
