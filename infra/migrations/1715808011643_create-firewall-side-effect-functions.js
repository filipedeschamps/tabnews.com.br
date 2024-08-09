exports.up = (pgm) => {
  pgm.dropFunction(
    'firewall_create_content_text_child_side_effect',
    [
      {
        name: 'client_ip_input',
        mode: 'IN',
        type: 'inet',
      },
    ],
    { ifExists: true },
  );

  pgm.dropFunction(
    'firewall_create_content_text_root_side_effect',
    [
      {
        name: 'client_ip_input',
        mode: 'IN',
        type: 'inet',
      },
    ],
    { ifExists: true },
  );

  pgm.dropFunction(
    'firewall_create_user_side_effect',
    [
      {
        name: 'client_ip_input',
        mode: 'IN',
        type: 'inet',
      },
    ],
    { ifExists: true },
  );

  pgm.createFunction(
    'firewall_create_content_text_child_side_effect',
    [
      {
        name: 'client_ip_input',
        mode: 'IN',
        type: 'inet',
      },
    ],
    {
      returns:
        'TABLE (id uuid, published_at timestamp, status_before_update varchar, status varchar, owner_id uuid, tabcoins integer)',
      language: 'plpgsql',
      replace: true,
    },
    `
  DECLARE
    contents_to_update record;
  BEGIN
    FOR contents_to_update IN (
      SELECT
        metadata->>'id' as id
      FROM
        events
      WHERE
        type = 'create:content:text_child'
        AND originator_ip = client_ip_input
        AND created_at > NOW() - INTERVAL '10 minutes'
    )
    LOOP
      UPDATE
        contents
      SET
        status = 'firewall'
      WHERE
        contents.id = contents_to_update.id::uuid
      RETURNING
        contents.id,
        contents.published_at,
        contents.status,
        contents.owner_id,
        get_content_current_tabcoins(contents_to_update.id::uuid),
        (SELECT contents.status FROM contents WHERE contents.id = contents_to_update.id::uuid)
      INTO
        id,
        published_at,
        status,
        owner_id,
        tabcoins,
        status_before_update;

      IF FOUND THEN
        RETURN NEXT;
      END IF;
    END LOOP;
  END;
  `,
  );

  pgm.createFunction(
    'firewall_create_content_text_root_side_effect',
    [
      {
        name: 'client_ip_input',
        mode: 'IN',
        type: 'inet',
      },
    ],
    {
      returns:
        'TABLE (id uuid, title varchar, published_at timestamp, status_before_update varchar, status varchar, owner_id uuid, tabcoins integer)',
      language: 'plpgsql',
      replace: true,
    },
    `
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
        AND originator_ip = client_ip_input
        AND created_at > NOW() - INTERVAL '10 minutes'
    )
    LOOP
      UPDATE
        contents
      SET
        status = 'firewall'
      WHERE
        contents.id = contents_to_update.id::uuid
      RETURNING
        contents.id,
        contents.title,
        contents.published_at,
        contents.status,
        contents.owner_id,
        get_content_current_tabcoins(contents_to_update.id::uuid),
        (SELECT contents.status FROM contents WHERE contents.id = contents_to_update.id::uuid)
      INTO
        id,
        title,
        published_at,
        status,
        owner_id,
        tabcoins,
        status_before_update;

      IF FOUND THEN
        RETURN NEXT;
      END IF;
    END LOOP;
  END;
  `,
  );

  pgm.createFunction(
    'firewall_create_user_side_effect',
    [
      {
        name: 'client_ip_input',
        mode: 'IN',
        type: 'inet',
      },
    ],
    {
      returns: 'TABLE (id uuid, username varchar, email varchar)',
      language: 'plpgsql',
      replace: true,
    },
    `
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
          AND originator_ip = client_ip_input
          AND created_at > NOW() - INTERVAL '30 minutes'
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
    `,
  );
};

exports.down = false;
