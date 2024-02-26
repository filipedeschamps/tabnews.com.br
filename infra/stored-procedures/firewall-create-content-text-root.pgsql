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


CREATE OR REPLACE FUNCTION firewall_create_content_text_root_side_effect(clientIp inet) RETURNS TABLE (
  content_id uuid,
  content_published_at timestamp,
  content_status varchar,
  content_owner_id uuid,
  content_tabcoins integer
) AS $$
DECLARE
  contents_to_update record;
BEGIN

    FOR contents_to_update IN (
        SELECT
          metadata->>'id' as id
        FROM
          events
        WHERE
          type = 'create:content:text_root'
          AND originator_ip = clientIp
          AND created_at > NOW() - INTERVAL '2 minutes'
    )
    LOOP
      UPDATE
        contents
      SET
        status = 'deleted',
        deleted_at = (NOW() AT TIME ZONE 'utc'),
        updated_at = (NOW() AT TIME ZONE 'utc')
      WHERE
        id = contents_to_update.id::uuid
        AND status = 'published'
      RETURNING
        id,
        published_at,
        status,
        owner_id,
        get_current_balance('content:tabcoin', contents_to_update.id::uuid)
      INTO
        content_id,
        content_published_at,
        content_status,
        content_owner_id,
        content_tabcoins;

      IF FOUND THEN
        RETURN NEXT;
      END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
