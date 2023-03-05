import user from 'models/user.js';
import content from 'models/content.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import removeMarkdown from 'models/remove-markdown.js';
import { NotFoundError } from 'errors/index.js';

import { UserPage } from 'pages/interface';

export default UserPage;

export async function getStaticPaths() {
  const relevantResults = await content.findWithStrategy({
    strategy: 'relevant',
    where: {
      parent_id: null,
      status: 'published',
    },
    attributes: {
      exclude: ['body'],
    },
    page: 1,
    per_page: 100,
  });

  const paths = relevantResults.rows.map((content) => {
    return {
      params: {
        username: content.owner_username,
      },
    };
  });

  return {
    paths,
    fallback: 'blocking',
  };
}

export async function getStaticProps(context) {
  const userTryingToGet = user.createAnonymous();

  try {
    context.params = validator(context.params, {
      username: 'required',
      page: 'optional',
      per_page: 'optional',
    });
  } catch (error) {
    return {
      notFound: true,
    };
  }

  let results;

  try {
    results = await content.findWithStrategy({
      strategy: 'new',
      where: {
        owner_username: context.params.username,
        status: 'published',
      },
      page: context.params.page,
      per_page: context.params.per_page,
    });
  } catch (error) {
    // `content` model will throw a `NotFoundError` if the user is not found.
    if (error instanceof NotFoundError) {
      return {
        notFound: true,
        revalidate: 1,
      };
    }

    throw error;
  }

  const contentListFound = results.rows;

  const secureContentListFound = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

  const userFound = await user.findOneByUsername(context.params.username);
  const secureUserFound = authorization.filterOutput(userTryingToGet, 'read:user', userFound);

  for (const content of secureContentListFound) {
    if (content.parent_id) {
      content.body = removeMarkdown(content.body, { maxLength: 255 });
    } else {
      delete content.body;
    }
  }

  return {
    props: {
      contentListFound: JSON.parse(JSON.stringify(secureContentListFound)),
      pagination: results.pagination,
      userFound: JSON.parse(JSON.stringify(secureUserFound)),
    },

    revalidate: 10,
  };
}
