/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('entity_relations', {
    entity_id: {
      type: 'uuid',
      notNull: true,
    },
    entity_type: {
      type: 'varchar',
      notNull: true,
    },
    target_id: {
      type: 'uuid',
      notNull: true,
    },
    target_type: {
      type: 'varchar',
      notNull: true,
    },
    relation_type: {
      type: 'varchar',
      notNull: true,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },
  });

  pgm.createConstraint(
    'entity_relations',
    'entity_relations_uniqueness_fkey',
    'UNIQUE ("entity_id", "target_id", "relation_type")',
  );

  pgm.createIndex('entity_relations', 'entity_id', {
    unique: false,
    name: 'entity_relations_entity_id_idx',
  });

  pgm.createIndex('entity_relations', 'relation_type', {
    unique: false,
    name: 'entity_relations_relation_type_idx',
  });

  pgm.createIndex('entity_relations', ['entity_id', 'relation_type'], {
    unique: false,
    name: 'entity_relations_entity_id_relation_type_idx',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = false;
