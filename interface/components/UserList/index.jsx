import { Label, Link, Pagination, PastTime, SkeletonLoader, Text } from '@/TabNewsUI';

import classes from './index.module.css';

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
    <ol className={classes.List} key={`user-list-${listNumberStart}`} start={listNumberStart}>
      {userList.map((userObject) => (
        <UserListItem key={userObject.id} user={userObject} />
      ))}
    </ol>
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
    <li className={classes.Item}>
      <div>
        <div className={classes.Username}>
          <Link className={classes.Link} href={`/${user.username}`}>
            {user.username}
            {user.features.includes('nuked') && (
              <Label variant="danger" className={classes.NukedLabel}>
                nuked
              </Label>
            )}
          </Link>
        </div>
        {user.description && <Text className={classes.Description}>{user.description}</Text>}
        <div className={classes.Metadata}>
          <PastTime formatText={formatUpdatedAt} direction="ne" date={user.updated_at} />
          {' · '}
          <Text>{getTabCoinsText(user.tabcoins)}</Text>
          {' · '}
          <Text>{user.tabcash} tabcash</Text>
        </div>
      </div>
    </li>
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
