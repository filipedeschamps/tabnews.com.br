import { Box, Label, Link, Pagination, PastTime, SkeletonLoader, Text } from '@/TabNewsUI';

export default function UserListPaginated({ userList, pagination }) {
  const listNumberStart = pagination.perPage * (pagination.currentPage - 1) + 1;

  return (
    <>
      {userList?.length ? (
        <UserList userList={userList} listNumberStart={listNumberStart} />
      ) : (
        <UserListLoading pagination={pagination} />
      )}

      <Pagination {...pagination} />
    </>
  );
}

function UserList({ userList, listNumberStart }) {
  return (
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
      {userList.map((userObject) => (
        <UserListItem key={userObject.id} user={userObject} />
      ))}
    </Box>
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
        <Box sx={{ wordBreak: 'break-word' }}>
          <Link
            sx={{
              fontWeight: 'semibold',
              ':link': {
                color: 'fg.default',
              },
              ':visited': {
                color: 'fg.subtle',
              },
            }}
            href={`/${user.username}`}>
            {user.username}
            {user.features.includes('nuked') && (
              <Label variant="danger" sx={{ ml: 1 }}>
                nuked
              </Label>
            )}
          </Link>
        </Box>
        {user.description && (
          <Text
            sx={{
              display: 'block',
              overflow: 'auto',
              wordWrap: 'break-word',
              fontWeight: 'normal',
              fontStyle: 'italic',
              fontSize: 1,
            }}>
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

function UserListLoading({ pagination }) {
  const itemHeightRem = 3.13;
  const listHeightRem = itemHeightRem * pagination.perPage;

  return (
    <SkeletonLoader
      title="Carregando usuários..."
      style={{ height: `${listHeightRem}rem`, width: '100%' }}
      uniqueKey="user-list-loading">
      {Array.from({ length: pagination.perPage }).map((_, i) => (
        <UserListItemLoading key={i} index={i} />
      ))}
    </SkeletonLoader>
  );
}

function UserListItemLoading({ index }) {
  const spaceBetweenItems = 9;
  const spaceBetweenRows = 8;
  const textHeight = 16;
  const usernameY = index * (textHeight + spaceBetweenItems) * 2 + 4;

  return (
    <>
      <rect x="28" y={usernameY} rx="5" ry="5" width="140" height={textHeight} />
      <rect x="28" y={usernameY + spaceBetweenRows + textHeight} rx="5" ry="5" width="240" height="12" />
    </>
  );
}
