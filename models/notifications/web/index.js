import database from 'infra/database';

async function send({ type, event_type, recipient_id, body_reply_line, content_link }) {
  const query = {
    text: `
      INSERT INTO
        user_notifications (type, event_type, recipient_id, body_reply_line, content_link)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING
        *
      ;`,
    values: [type, event_type, recipient_id, body_reply_line, content_link],
  };

  const results = await database.query(query);

  if (results.rowCount === 0) {
    return;
  }

  return results.rows[0];
}

export default Object.freeze({
  send,
});
