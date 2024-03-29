exports.up = (pgm) => {
  pgm.dropConstraint('contents', 'contents_status_check');
  pgm.addConstraint(
    'contents',
    'contents_status_check',
    "CHECK (status IN ('draft', 'published', 'deleted', 'firewall'))",
  );
};

exports.down = (pgm) => {
  pgm.dropConstraint('contents', 'contents_status_check');
  pgm.addConstraint('contents', 'contents_status_check', "CHECK (status IN ('draft', 'published', 'deleted'))");
};
