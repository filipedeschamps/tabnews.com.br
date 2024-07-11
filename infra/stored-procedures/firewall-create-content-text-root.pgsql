CREATE OR REPLACE FUNCTION firewall_create_content_text_root(clientIp inet) RETURNS boolean AS $$
DECLARE
  contents_count integer;
BEGIN
  contents_count := (
    SELECT
      COUNT(*)
    FROM
      events
    WHERE
      originator_ip = clientIp
      AND type = 'create:content:text_root'
      AND created_at > NOW() - INTERVAL '5 seconds'
  );

  IF contents_count >= 2 THEN
    RETURN false;
  ELSE
    RETURN true;
  END IF;

END;
$$ LANGUAGE plpgsql;
