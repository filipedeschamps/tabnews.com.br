CREATE OR REPLACE FUNCTION get_balance_and_update_score(score_type_input text, recipient_id_input uuid) RETURNS integer AS $$
DECLARE
  total_balance integer;
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
      balance_type = score_type_input
      AND recipient_id = recipient_id_input
      AND amount > 0
  );
  negative_balance := (
    SELECT
      COALESCE(sum(amount), 0)
    FROM
      balance_operations
    WHERE
      balance_type = score_type_input
      AND recipient_id = recipient_id_input
      AND amount < 0
  );
  new_score := COALESCE(trunc((positive_balance + 0.9208) / (positive_balance - negative_balance + 2.8416),3), 0.5);
  total_balance := COALESCE(positive_balance + negative_balance, 0);
  UPDATE contents
  SET
    score = new_score,
    tabcoins = total_balance
  WHERE
      id = recipient_id_input;
  RETURN total_balance;
END;
$$ LANGUAGE plpgsql;
