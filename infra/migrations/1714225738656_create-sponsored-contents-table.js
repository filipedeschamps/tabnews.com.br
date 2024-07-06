exports.up = async (pgm) => {
  pgm.createTable('sponsored_contents', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      primaryKey: true,
    },

    slug: {
      type: 'varchar',
      check: 'length(slug) <= 160',
      notNull: true,
    },

    title: {
      type: 'varchar',
      check: 'length(title) <= 255',
      notNull: false,
    },

    body: {
      type: 'text',
      check: 'length(body) <= 20000',
      notNull: true,
    },

    owner_id: {
      type: 'uuid',
      notNull: true,
    },

    link: {
      type: 'varchar',
      check: 'length(link) <= 2000',
      notNull: false,
    },

    bid: {
      type: 'integer',
      notNull: true,
    },

    activated_at: {
      type: 'timestamp with time zone',
      notNull: false,
    },

    deactivated_at: {
      type: 'timestamp with time zone',
      notNull: false,
    },

    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },

    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },
  });

  pgm.createIndex('sponsored_contents', ['owner_id', 'slug'], {
    name: 'sponsored_contents_owner_id_slug_unique_index',
    unique: true,
  });

  pgm.createTrigger(
    'sponsored_contents',
    'unique_sponsored_contents_contents_owner_id_slug_trigger',
    {
      when: 'BEFORE',
      operation: ['INSERT', 'UPDATE'],
      language: 'plpgsql',
      level: 'row',
    },
    `
    BEGIN
      IF EXISTS (
        SELECT 1 FROM contents WHERE owner_id = NEW.owner_id AND slug = NEW.slug AND deleted_at IS NULL
      ) THEN
        RAISE EXCEPTION 'This "owner_id" and "slug" already exists in "contents" table.'
        USING ERRCODE = '23505';
      END IF;
      RETURN NEW;
    END;
    `,
  );

  pgm.createTrigger(
    'contents',
    'unique_contents_sponsored_contents_owner_id_slug_trigger',
    {
      when: 'BEFORE',
      operation: ['INSERT', 'UPDATE'],
      language: 'plpgsql',
      level: 'row',
    },
    `
    BEGIN
      IF EXISTS (
        SELECT 1 FROM sponsored_contents WHERE owner_id = NEW.owner_id AND slug = NEW.slug
      ) THEN
        RAISE EXCEPTION 'This "owner_id" and "slug" already exists in "sponsored_contents" table.'
        USING ERRCODE = '23505';
      END IF;
      RETURN NEW;
    END;
    `,
  );
};

exports.down = false;
