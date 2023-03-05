import user from 'models/user.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import removeMarkdown from 'models/remove-markdown.js';

import { UserPage } from 'pages/interface';
import { NotFoundError } from 'errors';

export default UserPage;

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
}

export async function getStaticProps(context) {
  const userTryingToGet = user.createAnonymous();

  try {
    context.params = validator(context.params, {
      username: 'required',
    });
  } catch (error) {
    return {
      notFound: true,
    };
  }

  let results;

  try {
    results = await user.findAllBookmarksWithContentByUsername({
      username: context.params.username,
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

  let bookmarksFound = results;
  const secureBookmarksListFound = authorization.filterOutput(userTryingToGet, 'read:content:list', bookmarksFound);
  const userFound = await user.findOneByUsername(context.params.username);
  const secureUserFound = authorization.filterOutput(userTryingToGet, 'read:user', userFound);

  return {
    props: {
      bookmarksFound: JSON.parse(JSON.stringify(secureBookmarksListFound)),
      userFound: JSON.parse(JSON.stringify(secureUserFound)),
    },

    revalidate: 5,
  };
}
