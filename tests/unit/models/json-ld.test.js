import webserver from 'infra/webserver';
import jsonLd from 'models/json-ld';

describe('json-ld model', () => {
  describe('getBreadcrumb', () => {
    test('complete breadcrumb', () => {
      const breadcrumbItems = [
        { name: 'Recentes', url: 'https://tabnews.com.br/recentes/pagina/1' },
        { name: 'Todos', url: 'https://tabnews.com.br/recentes/todos/1' },
        { name: 'Página 7', url: 'https://tabnews.com.br/recentes/todos/7' },
      ];

      expect(jsonLd.getBreadcrumb(breadcrumbItems)).toStrictEqual({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Recentes', item: 'https://tabnews.com.br/recentes/pagina/1' },
          { '@type': 'ListItem', position: 2, name: 'Todos', item: 'https://tabnews.com.br/recentes/todos/1' },
          { '@type': 'ListItem', position: 3, name: 'Página 7', item: 'https://tabnews.com.br/recentes/todos/7' },
        ],
      });
    });
  });

  describe('getOrganization', () => {
    test('organization with a logo for a white background', () => {
      expect(jsonLd.getOrganization()).toStrictEqual({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        url: webserver.host,
        logo: `${webserver.host}/brand/rounded-light-filled.svg`,
        name: 'TabNews',
        description:
          'O TabNews é um site focado na comunidade da área de tecnologia, destinado a debates e troca de conhecimentos por meio de publicações e comentários criados pelos próprios usuários.',
        email: 'contato@tabnews.com.br',
        foundingDate: '2022-05-06T15:20:01.158Z',
      });
    });
  });

  describe('getPosting', () => {
    test('root content without children', () => {
      const content = {
        id: '2a0afc7a-0778-493e-ab5f-2517e303d746',
        owner_id: '78c5e17c-14a7-4a32-a932-578477145961',
        parent_id: null,
        slug: 'content-slug',
        title: 'Content title',
        body: '# My body with _markdown_\n**Formatting** :)',
        status: 'published',
        type: 'content',
        source_url: 'https://www.tabnews.com.br/recentes/pagina/1',
        created_at: new Date('2024-05-12T04:12:32.831Z'),
        updated_at: new Date('2024-08-10T20:11:38.290Z'),
        published_at: new Date('2024-05-13T04:33:12.421Z'),
        deleted_at: null,
        owner_username: 'ownerName',
        tabcoins: 8,
        tabcoins_credit: 10,
        tabcoins_debit: -2,
        children_deep_count: 0,
      };

      expect(jsonLd.getPosting(content)).toStrictEqual({
        '@context': 'https://schema.org',
        '@type': 'DiscussionForumPosting',
        headline: 'Content title',
        sharedContent: {
          '@type': 'WebPage',
          url: 'https://www.tabnews.com.br/recentes/pagina/1',
        },
        identifier: content.id,
        author: {
          '@type': 'Person',
          name: 'ownerName',
          identifier: content.owner_id,
          url: `${webserver.host}/ownerName`,
        },
        url: `${webserver.host}/ownerName/content-slug`,
        datePublished: content.published_at,
        dateModified: content.updated_at,
        text: 'My body with markdown Formatting :)',
        interactionStatistic: [
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/LikeAction',
            userInteractionCount: 10,
          },
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/DislikeAction',
            userInteractionCount: 2,
          },
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/CommentAction',
            userInteractionCount: 0,
          },
        ],
        comment: [],
      });
    });

    test('root content with children', () => {
      const content = {
        id: '3025c3a5-caca-4299-9ed1-769ffe4e37da',
        owner_id: '25553d73-b7dd-47aa-b894-c8b5acc7de83',
        parent_id: null,
        slug: 'my-content',
        title: 'My new content',
        body: 'Root content body',
        status: 'published',
        type: 'content',
        source_url: null,
        created_at: new Date('2024-07-18T13:22:11.387Z'),
        updated_at: new Date('2024-07-20T10:14:49.894Z'),
        published_at: new Date('2024-07-19T19:25:31.993Z'),
        deleted_at: null,
        owner_username: 'rootContentUser',
        tabcoins: 3,
        tabcoins_credit: 3,
        tabcoins_debit: -1,
        children_deep_count: 4,
        children: [
          {
            id: '4d8ae77a-3e0a-4631-8d61-278ba4245392',
            owner_id: '991c8775-7bc3-4472-99a6-13ca45817e6b',
            parent_id: '3025c3a5-caca-4299-9ed1-769ffe4e37da',
            slug: 'first-child-content',
            title: null,
            body: 'First child content',
            status: 'published',
            type: 'content',
            source_url: null,
            created_at: new Date('2024-07-19T20:11:03.100Z'),
            updated_at: new Date('2024-07-19T20:11:37.530Z'),
            published_at: new Date('2024-07-19T20:11:05.200Z'),
            deleted_at: null,
            owner_username: 'userChild1',
            tabcoins: 3,
            tabcoins_credit: 2,
            tabcoins_debit: 0,
            children_deep_count: 1,
            children: [
              {
                id: '76c09a77-240f-41a5-abf9-ae6bdb20945d',
                owner_id: '12cef543-fa6f-48bb-90d4-fae0b1d65684',
                parent_id: '4d8ae77a-3e0a-4631-8d61-278ba4245392',
                slug: 'first-child-child',
                title: null,
                body: "First child's child",
                status: 'published',
                type: 'content',
                source_url: null,
                created_at: new Date('2024-01-30T15:12:33.121Z'),
                updated_at: new Date('2024-02-03T12:02:10.424Z'),
                published_at: new Date('2024-02-02T15:13:22.595Z'),
                deleted_at: null,
                owner_username: 'userChild11',
                tabcoins: 0,
                tabcoins_credit: 0,
                tabcoins_debit: 0,
                children_deep_count: 0,
                children: [],
              },
            ],
          },
          {
            id: '88c7e29f-e1d1-440e-9c84-b96c68e4e035',
            owner_id: '2b35ca93-2424-45a3-8cfd-7195e6c8e281',
            parent_id: '3025c3a5-caca-4299-9ed1-769ffe4e37da',
            slug: 'second-child',
            title: null,
            body: 'Second child',
            status: 'published',
            type: 'content',
            source_url: null,
            created_at: new Date('2024-01-01T10:15:18.921Z'),
            updated_at: new Date('2024-02-25T15:32:49.894Z'),
            published_at: new Date('2024-01-10T19:13:31.993Z'),
            deleted_at: null,
            owner_username: 'userChild2',
            tabcoins: -1,
            tabcoins_credit: 1,
            tabcoins_debit: -2,
            children_deep_count: 1,
            children: [],
          },
        ],
      };

      expect(jsonLd.getPosting(content)).toStrictEqual({
        '@context': 'https://schema.org',
        '@type': 'DiscussionForumPosting',
        headline: 'My new content',
        sharedContent: undefined,
        identifier: content.id,
        author: {
          '@type': 'Person',
          name: 'rootContentUser',
          identifier: content.owner_id,
          url: `${webserver.host}/rootContentUser`,
        },
        url: `${webserver.host}/rootContentUser/my-content`,
        datePublished: content.published_at,
        dateModified: content.updated_at,
        text: 'Root content body',
        interactionStatistic: [
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/LikeAction',
            userInteractionCount: 3,
          },
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/DislikeAction',
            userInteractionCount: 1,
          },
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/CommentAction',
            userInteractionCount: 4,
          },
        ],
        comment: [
          {
            '@type': 'Comment',
            identifier: content.children[0].id,
            author: {
              '@type': 'Person',
              name: 'userChild1',
              identifier: content.children[0].owner_id,
              url: `${webserver.host}/userChild1`,
            },
            url: `${webserver.host}/userChild1/first-child-content`,
            datePublished: content.children[0].published_at,
            dateModified: content.children[0].updated_at,
            text: 'First child content',
            interactionStatistic: [
              {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/LikeAction',
                userInteractionCount: 2,
              },
              {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/DislikeAction',
                userInteractionCount: 0,
              },
              {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/CommentAction',
                userInteractionCount: 1,
              },
            ],
            comment: [
              {
                '@type': 'Comment',
                identifier: content.children[0].children[0].id,
                author: {
                  '@type': 'Person',
                  name: 'userChild11',
                  identifier: content.children[0].children[0].owner_id,
                  url: `${webserver.host}/userChild11`,
                },
                url: `${webserver.host}/userChild11/first-child-child`,
                datePublished: content.children[0].children[0].published_at,
                dateModified: content.children[0].children[0].updated_at,
                text: "First child's child",
                interactionStatistic: [
                  {
                    '@type': 'InteractionCounter',
                    interactionType: 'https://schema.org/LikeAction',
                    userInteractionCount: 0,
                  },
                  {
                    '@type': 'InteractionCounter',
                    interactionType: 'https://schema.org/DislikeAction',
                    userInteractionCount: 0,
                  },
                  {
                    '@type': 'InteractionCounter',
                    interactionType: 'https://schema.org/CommentAction',
                    userInteractionCount: 0,
                  },
                ],
                comment: [],
              },
            ],
          },
          {
            '@type': 'Comment',
            identifier: content.children[1].id,
            author: {
              '@type': 'Person',
              name: 'userChild2',
              identifier: content.children[1].owner_id,
              url: `${webserver.host}/userChild2`,
            },
            url: `${webserver.host}/userChild2/second-child`,
            datePublished: content.children[1].published_at,
            dateModified: content.children[1].updated_at,
            text: 'Second child',
            interactionStatistic: [
              {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/LikeAction',
                userInteractionCount: 1,
              },
              {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/DislikeAction',
                userInteractionCount: 2,
              },
              {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/CommentAction',
                userInteractionCount: 1,
              },
            ],
            comment: [],
          },
        ],
      });
    });
  });

  describe('getProfile', () => {
    test('profile with basic data only', () => {
      const user = {
        id: '90323057-ac67-4d2e-b071-a4bbdf6b8ddd',
        username: 'someone',
        description: '',
        email: 'someone@example.com',
        notifications: true,
        features: ['create:session', 'read:session', 'create:content'],
        tabcoins: 0,
        tabcash: 0,
        created_at: new Date('2023-05-11T13:14:25.000Z'),
        updated_at: new Date('2024-08-24T22:16:32.000Z'),
      };

      expect(jsonLd.getProfile(user)).toStrictEqual({
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        dateCreated: new Date('2023-05-11T13:14:25.000Z'),
        dateModified: new Date('2024-08-24T22:16:32.000Z'),
        mainEntity: {
          '@type': 'Person',
          name: 'someone',
          identifier: user.id,
          description: undefined,
        },
      });
    });

    test('profile with description', () => {
      const user = {
        id: 'acf5c5c5-12db-4442-b3b2-e4df1ffd4a59',
        username: 'newUser',
        description: 'My _description_ **with** Markdown! ![image](http://example.com/image.png)\n\nNew line',
        email: 'new@example.com',
        notifications: false,
        features: [],
        tabcoins: 3,
        tabcash: 7,
        created_at: new Date('2024-08-15T15:32:11.370Z'),
        updated_at: new Date('2024-08-24T23:10:44.555Z'),
      };

      expect(jsonLd.getProfile(user)).toStrictEqual({
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        dateCreated: new Date('2024-08-15T15:32:11.370Z'),
        dateModified: new Date('2024-08-24T23:10:44.555Z'),
        mainEntity: {
          '@type': 'Person',
          name: 'newUser',
          identifier: user.id,
          description: 'My description with Markdown! image New line',
        },
      });
    });
  });
});
