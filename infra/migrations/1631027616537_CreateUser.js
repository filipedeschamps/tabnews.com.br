exports.up = (pgm) => {

    pgm.createExtension("uuid-ossp", {
        ifNotExists: true,
        schema: 'public'
    });

    pgm.createTable('users', {
        id: {
            type: 'uuid',
            default: pgm.func('uuid_generate_v4()'),
            notNull: true,
            primaryKey: true
        },
        name: { type: 'string', length: 128, notNull: true },
        email: { type: 'string', length: 255, notNull: true, unique: true },
        password: { type: 'string', length: 255, notNull: true },
        avatar_file: { type: 'string', length: 255 },
        created_at: { type: 'timestamp', default: pgm.func("(now() at time zone 'utc')") },
        updated_at: { type: 'timestamp', default: pgm.func("(now() at time zone 'utc')") }
    })
};

exports.down = (pgm) => {
    pgm.dropTable('users');
};
