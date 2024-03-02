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


CREATE OR REPLACE FUNCTION firewall_create_user_side_effect(clientIp inet) RETURNS TABLE (
  id uuid,
  username varchar,
  email varchar
) AS $$
DECLARE
  users_to_block record;
  features_to_remove text[] := array['read:activation_token', 'read:recovery_token', 'create:session', 'read:session'];
  feature text;
BEGIN
    FOR users_to_block IN (
        SELECT
          metadata->>'id' as id
        FROM
          events
        WHERE
          type = 'create:user'
          AND originator_ip = clientIp
          AND created_at > NOW() - INTERVAL '2 minutes'
    )
    LOOP
      id := users_to_block.id;

      FOREACH feature IN ARRAY features_to_remove
        LOOP
          UPDATE
            users
          SET
            features = array_remove(features, feature)
          WHERE
            users.id = users_to_block.id::uuid
          RETURNING
            users.username,
            users.email
          INTO
            username,
            email;
        END LOOP;

      RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
