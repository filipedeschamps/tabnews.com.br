import { randomUUID as uuidV4 } from 'node:crypto';

import { ValidationError } from 'errors';
import database from 'infra/database';
import balance from 'models/balance';
import content from 'models/content';
import validator from 'models/validator';

async function create(postedSponsoredContent, options = {}) {
  validateBidAndBudget(postedSponsoredContent);
  validateSetDeactivateAt(postedSponsoredContent);

  if (!postedSponsoredContent.slug) {
    postedSponsoredContent.slug = content.generateSlug(postedSponsoredContent.title) || uuidV4();
  }

  const validSponsoredContent = validateCreateSchema(postedSponsoredContent);

  validSponsoredContent.activated_at = new Date();

  const query = {
    text: `
      WITH inserted_sponsored_content AS (
        INSERT INTO
          sponsored_contents (id, slug, title, body, owner_id, link, bid, activated_at, deactivated_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING
          *
      )
      SELECT
        inserted_sponsored_content.*,
        users.username as owner_username
      FROM
        inserted_sponsored_content
      INNER JOIN
        users ON inserted_sponsored_content.owner_id = users.id
    ;`,
    values: [
      validSponsoredContent.id, // $1
      validSponsoredContent.slug, // $2
      validSponsoredContent.title, // $3
      validSponsoredContent.body, // $4
      validSponsoredContent.owner_id, // $5
      validSponsoredContent.link, // $6
      validSponsoredContent.bid, // $7
      validSponsoredContent.activated_at, // $8
      validSponsoredContent.deactivated_at, // $9
    ],
  };

  let createdSponsoredContent;
  try {
    const results = await database.query(query, { transaction: options.transaction });
    createdSponsoredContent = results.rows[0];
  } catch (error) {
    throw content.parseQueryErrorToCustomError(error);
  }

  await balance.sponsorContent(
    {
      contentOwnerId: validSponsoredContent.owner_id,
      tabcash: validSponsoredContent.budget,
    },
    {
      eventId: options.eventId,
      transaction: options.transaction,
    },
  );

  createdSponsoredContent.budget = validSponsoredContent.budget;

  return createdSponsoredContent;
}

function validateBidAndBudget(sponsoredContent) {
  if (sponsoredContent.bid > sponsoredContent.budget) {
    throw new ValidationError({
      message: 'O lance não pode ser maior do que o orçamento.',
      action: 'Diminua o lance ou aumente o orçamento.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:SPONSORED_CONTENT:VALIDATE_BID_AND_BUDGET:BID_HIGHER_THAN_BUDGET',
      key: 'bid',
    });
  }
}

function validateSetDeactivateAt(sponsoredContent) {
  if (sponsoredContent.deactivated_at) {
    const deactivateAt = new Date(sponsoredContent.deactivated_at);
    if (deactivateAt <= new Date()) {
      throw new ValidationError({
        message: 'A data de desativação não pode ser no passado.',
        action: 'Utilize uma data de desativação no futuro.',
        stack: new Error().stack,
        errorLocationCode: 'MODEL:SPONSORED_CONTENT:VALIDATE_DEACTIVATED_AT:DATE_IN_PAST',
        key: 'deactivated_at',
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
    link: 'optional',
    deactivated_at: 'optional',
    bid: 'required',
    budget: 'required',
  });

  return cleanValues;
}

export default Object.freeze({
  create,
});
