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
  id uuid,
  title varchar,
  published_at timestamp,
  status varchar,
  owner_id uuid,
  tabcoins integer
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
        deleted_at = (NOW() AT TIME ZONE 'utc')
      WHERE
        contents.id = contents_to_update.id::uuid
        AND contents.status = 'published'
      RETURNING
        contents.id,
        contents.title,
        contents.published_at,
        contents.status,
        contents.owner_id,
        get_content_current_tabcoins(contents_to_update.id::uuid)
      INTO
        id,
        title,
        published_at,
        status,
        owner_id,
        tabcoins;

      IF FOUND THEN
        RETURN NEXT;
      END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
