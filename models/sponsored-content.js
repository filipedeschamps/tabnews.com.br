import { v4 as uuidV4 } from 'uuid';

import { ValidationError } from 'errors';
import database from 'infra/database';
import balance from 'models/balance';
import content from 'models/content';
import pagination from 'models/pagination';
import user from 'models/user';
import validator from 'models/validator';

const MAX_ACTIVE_SPONSORED_CONTENTS = 5;
const MAX_SAME_USER_SPONSORED_CONTENTS = 1;

async function findAllByOwnerUsername(values) {
  const offset = (values.page - 1) * values.per_page;

  const userObject = await user.findOneByUsername(values.owner_username);

  const query = {
    text: `
      WITH content_window AS (
        SELECT
          COUNT(*) OVER()::INTEGER as total_rows,
          id,
          slug,
          title,
          source_url,
          published_at,
          updated_at
        FROM contents
        WHERE owner_id = $3 AND status = 'sponsored'
        ORDER BY published_at DESC
        LIMIT $1 OFFSET $2
      )
      SELECT
        sponsored_contents.id,
        sponsored_contents.content_id,
        sponsored_contents.deactivate_at,
        sponsored_contents.created_at,
        sponsored_contents.updated_at,
        content_window.slug,
        content_window.title,
        content_window.source_url,
        content_window.published_at,
        content_window.updated_at AS content_updated_at,
        (
          SELECT COUNT(*)
          FROM contents as children
          WHERE children.path @> ARRAY[content_window.id]
           AND children.status = 'published'
        ) as children_deep_count,
        $4 as owner_username,
        get_sponsored_content_current_tabcoins(sponsored_contents.id) AS tabcoins,
        get_sponsored_content_current_tabcash(sponsored_contents.id) AS tabcash,
        content_window.total_rows
      FROM
        sponsored_contents
      INNER JOIN
        content_window ON sponsored_contents.content_id = content_window.id
    ;`,
    values: [values.per_page, offset, userObject.id, userObject.username],
  };

  const results = await database.query(query);

  if (results.rows[0]) {
    values.total_rows = results.rows[0].total_rows;
  } else {
    const countQuery = {
      text: `
        SELECT COUNT(*)::INTEGER as total_rows
        FROM contents
        WHERE owner_id = $1 AND status = 'sponsored'
      ;`,
      values: [userObject.id],
    };
    const countResult = await database.query(countQuery);
    values.total_rows = countResult.rows[0].total_rows;
  }

  results.pagination = pagination.get(values);

  return results;
}

async function findOne(values) {
  const userObject = await user.findOneByUsername(values.owner_username);

  const query = {
    text: `
      SELECT
        sponsored_contents.*,
        contents.slug,
        contents.title,
        contents.body,
        contents.source_url,
        contents.published_at,
        contents.updated_at AS content_updated_at,
        contents.owner_id
      FROM
        contents
      INNER JOIN
        sponsored_contents ON contents.id = sponsored_contents.content_id
      WHERE
        contents.owner_id = $1 AND
        slug = $2
    ;`,
    values: [userObject.id, values.slug],
  };

  const results = await database.query(query);
  return results.rows[0];
}

async function create(postedSponsoredContent, options = {}) {
  validateSetDeactivateAt(postedSponsoredContent);

  if (!postedSponsoredContent.slug) {
    postedSponsoredContent.slug = content.generateSlug(postedSponsoredContent.title) || uuidV4();
  }

  const validSponsoredContent = validateCreateSchema(postedSponsoredContent);

  validSponsoredContent.published_at = new Date();
  const status = 'sponsored';
  const path = [];

  const query = {
    text: `
    WITH inserted_content AS (
      INSERT INTO
        contents (owner_id, slug, title, body, source_url, published_at, status, path)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    ),
    inserted_sponsored_content AS (
      INSERT INTO
        sponsored_contents (content_id, deactivate_at)
      VALUES (
        (SELECT inserted_content.id FROM inserted_content),
        $9
      )
      RETURNING *
    ),
    count_active_sponsored_content AS (
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN combined_contents.owner_id = $1 THEN 1 END) AS total_owner
      FROM (
        SELECT id, content_id
        FROM sponsored_contents
        WHERE 
          sponsored_contents.deactivate_at IS NULL OR
          sponsored_contents.deactivate_at > NOW()
        UNION ALL
        SELECT id, content_id FROM inserted_sponsored_content
      ) AS combined_sponsored_contents
      LEFT JOIN (
        SELECT id, owner_id FROM contents WHERE status = 'sponsored'
        UNION ALL
        SELECT id, owner_id FROM inserted_content
      ) AS combined_contents ON combined_contents.id = combined_sponsored_contents.content_id
    )
    SELECT
      inserted_sponsored_content.id,
      inserted_content.owner_id,
      inserted_content.slug,
      inserted_content.title,
      inserted_content.body,
      inserted_content.source_url,
      inserted_content.published_at,
      inserted_sponsored_content.content_id,
      inserted_sponsored_content.deactivate_at,
      inserted_sponsored_content.created_at,
      inserted_sponsored_content.updated_at,
      users.username as owner_username,
      count_active_sponsored_content.total as active_sponsored_contents,
      count_active_sponsored_content.total_owner as user_active_sponsored_contents
    FROM
      inserted_content
    INNER JOIN
      inserted_sponsored_content ON inserted_content.id = inserted_sponsored_content.content_id
    INNER JOIN
      users ON inserted_content.owner_id = users.id
    LEFT JOIN
      count_active_sponsored_content ON true
    ;`,
    values: [
      validSponsoredContent.owner_id,
      validSponsoredContent.slug,
      validSponsoredContent.title,
      validSponsoredContent.body,
      validSponsoredContent.source_url,
      validSponsoredContent.published_at,
      status,
      path,
      validSponsoredContent.deactivate_at,
    ],
  };

  let createdSponsoredContent;
  try {
    const results = await database.query(query, { transaction: options.transaction });
    createdSponsoredContent = results.rows[0];
  } catch (error) {
    throw content.parseQueryErrorToCustomError(error);
  }

  if (createdSponsoredContent.active_sponsored_contents > MAX_ACTIVE_SPONSORED_CONTENTS) {
    throw new ValidationError({
      message: `Não é possível criar uma nova publicação patrocinada.`,
      action: `Aguarde uma publicação patrocinada ser desativada para criar uma nova.`,
      errorLocationCode: 'MODEL:SPONSORED_CONTENT:CREATE:ACTIVE_LIMIT_REACHED',
    });
  }

  if (createdSponsoredContent.user_active_sponsored_contents > MAX_SAME_USER_SPONSORED_CONTENTS) {
    throw new ValidationError({
      message: `Não é possível criar uma nova publicação patrocinada.`,
      action: `Aguarde uma publicação patrocinada sua ser desativada para criar uma nova.`,
      errorLocationCode: 'MODEL:SPONSORED_CONTENT:CREATE:USER_ACTIVE_LIMIT_REACHED',
    });
  }

  const balances = await balance.sponsorContent(
    {
      sponsoredContentId: createdSponsoredContent.id,
      contentOwnerId: validSponsoredContent.owner_id,
      tabcash: validSponsoredContent.tabcash,
    },
    {
      eventId: options.eventId,
      transaction: options.transaction,
    },
  );

  createdSponsoredContent.tabcoins = balances.tabcoins;
  createdSponsoredContent.tabcash = balances.tabcash;

  return createdSponsoredContent;
}

async function update(newContent, options = {}) {
  const validPostedContent = validateUpdateSchema(newContent);

  validateSetDeactivateAt(newContent);

  try {
    const query = {
      text: `
          UPDATE sponsored_contents SET
            deactivate_at = $2,
            updated_at = (now() at time zone 'utc')
          WHERE
            id = $1
          RETURNING
            *,
            get_sponsored_content_current_tabcoins($1) AS tabcoins,
            get_sponsored_content_current_tabcash($1) AS tabcash
        ;`,
      values: [newContent.id, validPostedContent.deactivate_at],
    };

    const results = await database.query(query, { transaction: options.transaction });
    const updatedSponsoredContent = results.rows[0];

    const updatedContent = await content.update(updatedSponsoredContent.content_id, validPostedContent, options);

    const tabcash = newContent.tabcash ?? updatedSponsoredContent.tabcash;
    const tabcashToAdd = tabcash - updatedSponsoredContent.tabcash;

    if (tabcashToAdd < 0) {
      throw new ValidationError({
        message: `Não é possível diminuir a quantidade de TabCash da publicação patrocinada.`,
        action: `Utilize um valor maior ou igual à quantidade atual de TabCash da publicação.`,
        errorLocationCode: 'MODEL:SPONSORED_CONTENT:VALIDATE_UPDATE_TABCASH:DECREASE_VALUE',
        key: 'tabcash',
      });
    }

    if (tabcashToAdd > 0) {
      await balance.sponsorContent(
        {
          sponsoredContentId: updatedSponsoredContent.id,
          contentOwnerId: updatedContent.owner_id,
          tabcash: tabcashToAdd,
        },
        { skipSponsoredContentTabcoinInsert: true, eventId: options.eventId },
      );
    }

    return { ...newContent, ...updatedContent, ...updatedSponsoredContent, tabcash };
  } catch (error) {
    throw content.parseQueryErrorToCustomError(error);
  }
}

function validateSetDeactivateAt(sponsoredContent) {
  if (sponsoredContent.deactivate_at) {
    const deactivateAt = new Date(sponsoredContent.deactivate_at);
    if (deactivateAt <= new Date()) {
      throw new ValidationError({
        message: `"deactivate_at" não pode ser no passado.`,
        action: `Utilize uma data "deactivate_at" no futuro.`,
        errorLocationCode: 'MODEL:SPONSORED_CONTENT:VALIDATE_DEACTIVATE_AT:DATE_IN_PAST',
        key: 'deactivate_at',
      });
    }
  }
}

function validateCreateSchema(sponsoredContent) {
  const cleanValues = validator(sponsoredContent, {
    owner_id: 'required',
    slug: 'required',
    title: 'required',
    body: 'required',
    source_url: 'optional',
    deactivate_at: 'optional',
    create_sponsored_content_tabcash: 'required',
  });

  return cleanValues;
}

function validateUpdateSchema(sponsoredContent) {
  const cleanValues = validator(sponsoredContent, {
    slug: 'required',
    title: 'required',
    body: 'required',
    source_url: 'optional',
    deactivate_at: 'optional',
    create_sponsored_content_tabcash: 'optional',
  });

  return cleanValues;
}

export default Object.freeze({
  findAllByOwnerUsername,
  findOne,
  create,
  update,
});
