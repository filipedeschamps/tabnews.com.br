exports.up = async (pgm) => {
  await pgm.createIndex('balance_operations', ['balance_type', 'recipient_id']);
};

exports.down = false;
