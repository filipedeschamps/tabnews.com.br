import { randomUUID as uuidV4 } from 'node:crypto';

import { ValidationError } from 'errors';
import database from 'infra/database';
import balance from 'models/balance';
import content from 'models/content';
import validator from 'models/validator';

const MAX_SAME_USER_SPONSORED_CONTENTS = 1;

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
        sponsored_contents (id, content_id, deactivate_at)
        SELECT $9, inserted_content.id, $10
        FROM inserted_content
      RETURNING *
    ),
    count_active_sponsored_contents AS (
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
      count_active_sponsored_contents.total as active_sponsored_contents,
      count_active_sponsored_contents.total_owner as user_active_sponsored_contents
    FROM
      inserted_content
    INNER JOIN
      inserted_sponsored_content ON inserted_content.id = inserted_sponsored_content.content_id
    INNER JOIN
      users ON inserted_content.owner_id = users.id
    LEFT JOIN
      count_active_sponsored_contents ON true
    ;`,
    values: [
      validSponsoredContent.owner_id, // $1
      validSponsoredContent.slug, // $2
      validSponsoredContent.title, // $3
      validSponsoredContent.body, // $4
      validSponsoredContent.source_url, // $5
      validSponsoredContent.published_at, // $6
      status, // $7
      path, // $8
      validSponsoredContent.id, // $9
      validSponsoredContent.deactivate_at, // $10
    ],
  };

  let createdSponsoredContent;
  try {
    const results = await database.query(query, { transaction: options.transaction });
    createdSponsoredContent = results.rows[0];
  } catch (error) {
    throw content.parseQueryErrorToCustomError(error);
  }

  if (createdSponsoredContent.user_active_sponsored_contents > MAX_SAME_USER_SPONSORED_CONTENTS) {
    throw new ValidationError({
      message: `Não é possível criar uma nova publicação patrocinada.`,
      action: `Aguarde uma publicação patrocinada sua ser desativada ou desative-a manualmente para criar uma nova.`,
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

function validateSetDeactivateAt(sponsoredContent) {
  if (sponsoredContent.deactivate_at) {
    const deactivateAt = new Date(sponsoredContent.deactivate_at);
    if (deactivateAt <= new Date()) {
      throw new ValidationError({
        message: `"deactivate_at" não pode ser no passado.`,
        action: `Utilize uma data "deactivate_at" no futuro.`,
        stack: new Error().stack,
        errorLocationCode: 'MODEL:SPONSORED_CONTENT:VALIDATE_DEACTIVATE_AT:DATE_IN_PAST',
        key: 'deactivate_at',
      });
    }
  }
}

function validateCreateSchema(sponsoredContent) {
  const cleanValues = validator(sponsoredContent, {
    id: 'required',
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

export default Object.freeze({
  create,
});
