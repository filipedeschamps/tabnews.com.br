import database from 'infra/database';

async function send({ from, type, to_id, to_username, to_email, bodyReplyLine, contentLink }) {
  const notificationOptions = {
    from: from,
    type: type,
    to_id: to_id,
    to_username: to_username,
    to_email: to_email,
    bodyReplyLine: bodyReplyLine,
    contentLink: contentLink,
  };

  await sendNotificationWeb(notificationOptions);

  async function sendNotificationWeb({ from, type, to_id, to_username, to_email, bodyReplyLine, contentLink }) {
    const query = {
      text: `
          INSERT INTO
            user_notifications (from_id, type, to_id, to_username, to_email, body_reply_line, content_link)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7)
          RETURNING
            *
          ;`,
      values: [from, type, to_id, to_username, to_email, bodyReplyLine, contentLink],
    };

    const results = await database.query(query);

    if (results.rowCount === 0) {
      return false;
    }

    return results.rows[0];
  }
}

export default Object.freeze({
  send,
});
