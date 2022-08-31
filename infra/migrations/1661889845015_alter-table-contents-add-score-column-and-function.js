exports.up = async (pgm) => {
  await pgm.addColumns('contents', {
    score: {
      type: 'decimal',
      notNull: false,
    },
  });

  await pgm.createFunction(
    'update_content_score',
    [
      {
        name: 'recipient_id_input',
        mode: 'IN',
        type: 'uuid',
      },
    ],
    {
      returns: 'integer',
      language: 'plpgsql',
      replace: true,
    },
    `
    DECLARE
      positive_balance integer;
      negative_balance integer;
      new_score decimal;
    BEGIN
      positive_balance := (
        SELECT
          COALESCE(sum(amount), 0)
        FROM
          balance_operations
        WHERE
          balance_type = 'content:tabcoin'
          AND recipient_id = recipient_id_input
          AND amount > 0
      );

      negative_balance := (
        SELECT
          COALESCE(sum(amount), 0)
        FROM
          balance_operations
        WHERE
          balance_type = 'content:tabcoin'
          AND recipient_id = recipient_id_input
          AND amount < 0
      );

      new_score := COALESCE(trunc((positive_balance + 0.9208) / (positive_balance - negative_balance + 2.8416),3), 0.5);

      UPDATE
        contents
      SET
        score = new_score
      WHERE
          id = recipient_id_input;
      RETURN
        new_score;
    END;
  `
  );

  await pgm.createIndex('contents', ['score', 'created_at'], {
    name: 'contents_score_created_at_index',
  });
};

exports.down = false;
