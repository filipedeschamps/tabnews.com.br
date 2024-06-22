import { Box, Link, Pagination, PastTime, Text } from '@/TabNewsUI';

export default function UserList({ userList: list, pagination, paginationBasePath }) {
  const listNumberStart = pagination.perPage * (pagination.currentPage - 1) + 1;

  return (
    <>
      <Box
        as="ol"
        sx={{
          display: 'grid',
          gap: '0.5rem',
          gridTemplateColumns: 'min-content minmax(0, 1fr)',
          padding: 0,
          margin: 0,
        }}
        key={`user-list-${listNumberStart}`}
        start={listNumberStart}>
        {list.map((userObject) => (
          <UserListItem key={userObject.id} user={userObject} />
        ))}
      </Box>

      <Pagination {...pagination} basePath={paginationBasePath} />
    </>
  );
}

function UserListItem({ user }) {
  function getTabCoinsText(count) {
    return count > 1 || count < -1 ? `${count} tabcoins` : `${count} tabcoin`;
  }

  function formatUpdatedAt(date) {
    return `Atualizado há ${date}`;
  }

  return (
    <Box
      as="li"
      sx={{
        display: 'contents',
        ':before': {
          content: 'counter(list-item) "."',
          counterIncrement: 'list-item',
          fontWeight: 'semibold',
          width: 'min-content',
          marginLeft: 'auto',
        },
      }}>
      <Box>
        <Box
          sx={{
            overflow: 'auto',
            fontWeight: 'semibold',
            fontSize: 2,
            '> a': {
              ':link': {
                color: 'fg.default',
              },
              ':visited': {
                color: 'fg.subtle',
              },
            },
          }}>
          <Link sx={{ wordWrap: 'break-word' }} href={`/${user.username}`}>
            {user.username}
          </Link>
        </Box>
        {user.description && (
          <Text sx={{ wordWrap: 'break-word', fontWeight: 'normal', fontStyle: 'italic', fontSize: 1 }}>
            {user.description}
          </Text>
        )}
        <Box
          sx={{
            display: 'grid',
            gap: 1,
            gridTemplateColumns:
              'max-content max-content max-content max-content minmax(20px, max-content) max-content max-content',
            fontSize: 0,
            whiteSpace: 'nowrap',
            color: 'neutral.emphasis',
          }}>
          <PastTime formatText={formatUpdatedAt} direction="ne" date={user.updated_at} />
          {' · '}
          <Text>{getTabCoinsText(user.tabcoins)}</Text>
          {' · '}
          <Text>{user.tabcash} tabcash</Text>
        </Box>
      </Box>
    </Box>
  );
}
