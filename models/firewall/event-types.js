const firewall = ['firewall:block_contents:text_child', 'firewall:block_contents:text_root', 'firewall:block_users'];

const review = [
  'moderation:block_users',
  'moderation:block_contents:text_root',
  'moderation:block_contents:text_child',
  'moderation:unblock_users',
  'moderation:unblock_contents:text_root',
  'moderation:unblock_contents:text_child',
];

const reviewByAction = {
  confirm: {
    'firewall:block_users': 'moderation:block_users',
    'firewall:block_contents:text_root': 'moderation:block_contents:text_root',
    'firewall:block_contents:text_child': 'moderation:block_contents:text_child',
  },
  undo: {
    'firewall:block_users': 'moderation:unblock_users',
    'firewall:block_contents:text_root': 'moderation:unblock_contents:text_root',
    'firewall:block_contents:text_child': 'moderation:unblock_contents:text_child',
  },
};

export default Object.freeze({
  firewall,
  review,
  reviewByAction,
});
