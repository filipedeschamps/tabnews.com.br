CREATE OR REPLACE FUNCTION firewall_create_user(clientIp inet) RETURNS boolean AS $$
DECLARE
  users_count integer;
BEGIN
  users_count := (
    SELECT
      COUNT(*)
    FROM
      events
    WHERE
      originator_ip = clientIp
      AND type = 'create:user'
      AND created_at > NOW() - INTERVAL '5 seconds'
  );

  IF users_count >= 2 THEN
    RETURN false;
  ELSE
    RETURN true;
  END IF;

END;
$$ LANGUAGE plpgsql;
