import { NotFoundError } from 'errors';
import database from 'infra/database';

async function findOneById(notificationId) {
  const query = {
    text: `
      SELECT
        *
      FROM
        user_notifications
      WHERE
        id = $1
      LIMIT
        1
    `,
    values: [notificationId],
  };

  try {
    const result = await database.query(query);
    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: `Notificação com o ID "${notificationId}" não encontrada.`,
        action: 'Verifique se o ID está correto.',
        stack: new Error().stack,
        errorLocationCode: 'MODEL:NOTIFICATIONS:FIND_ONE_BY_ID:NOT_FOUND',
        key: 'id',
      });
    }
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao encontrar notificação por ID:', error);
    throw error;
  }
}

async function updateStatusToReadById(notificationId) {
  const query = {
    text: `
      UPDATE
        user_notifications
      SET
        status = 'read',
        updated_at = NOW() AT TIME ZONE 'utc'
      WHERE
        id = $1
      RETURNING
        status
    `,
    values: [notificationId],
  };

  try {
    const result = await database.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao atualizar status da notificação para "read":', error);
    throw error;
  }
}

async function deleteAllByUserId(userId) {
  const query = {
    text: `
      DELETE FROM
        user_notifications
      WHERE
        to_id = $1
    `,
    values: [userId],
  };

  try {
    const result = await database.query(query);
    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: `Nenhuma notificação encontrada para o usuário com ID "${userId}".`,
        action: 'Verifique se o ID está correto e se existem notificações para o usuário.',
        stack: new Error().stack,
        errorLocationCode: 'MODEL:NOTIFICATIONS:DELETE_ALL_BY_USER_ID:NOT_FOUND',
        key: 'to_id',
      });
    }
    return 'success';
  } catch (error) {
    console.error('Erro ao excluir todas as notificações do usuário:', error);
    throw error;
  }
}

async function markAllAsReadByUserId(userId) {
  const query = {
    text: `
      UPDATE
        user_notifications
      SET
        status = 'read',
        updated_at = NOW() AT TIME ZONE 'utc'
      WHERE
        to_id = $1
    `,
    values: [userId],
  };

  try {
    const result = await database.query(query);
    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: `Nenhuma notificação não lida encontrada para o usuário com ID "${userId}".`,
        action: 'Verifique se o ID está correto e se existem notificações não lidas para o usuário.',
        stack: new Error().stack,
        errorLocationCode: 'MODEL:NOTIFICATIONS:MARK_ALL_AS_READ_BY_USER_ID:NOT_FOUND',
        key: 'to_id',
      });
    }
    return 'success';
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas do usuário:', error);
    throw error;
  }
}

async function findAllCountByUserId(userId) {
  const query = {
    text: `
      SELECT
        COUNT(*)
      FROM
        user_notifications
      WHERE
        to_id = $1
    `,
    values: [userId],
  };

  try {
    const result = await database.query(query);
    const count = parseInt(result.rows[0].count, 10);

    if (count === 0) {
      throw new NotFoundError({
        message: `Nenhuma notificação encontrada para o usuário com ID "${userId}".`,
        action: 'Verifique se o ID está correto e se existem notificações para o usuário.',
        stack: new Error().stack,
        errorLocationCode: 'MODEL:NOTIFICATIONS:CHECK_IF_NOTIFICATIONS_EXIST_FOR_USER:NOT_FOUND',
        key: 'to_id',
      });
    }

    return count;
  } catch (error) {
    console.error('Erro ao verificar se existem notificações para o usuário:', error);
    throw error;
  }
}

async function findAllByUserId(userId) {
  const query = {
    text: `
      SELECT
        *
      FROM
        user_notifications
      WHERE
        to_id = $1
    `,
    values: [userId],
  };

  try {
    const result = await database.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError({
        message: `Nenhuma notificação encontrada para o usuário com ID "${userId}".`,
        action: 'Verifique se o ID está correto e se existem notificações para o usuário.',
        stack: new Error().stack,
        errorLocationCode: 'MODEL:NOTIFICATIONS:CHECK_IF_NOTIFICATIONS_EXIST_FOR_USER:NOT_FOUND',
        key: 'to_id',
      });
    }

    return result.rows;
  } catch (error) {
    console.error('Erro ao verificar se existem notificações para o usuário:', error);
    throw error;
  }
}

export default Object.freeze({
  findOneById,
  findAllByUserId,
  findAllCountByUserId,
  updateStatusToReadById,
  deleteAllByUserId,
  markAllAsReadByUserId,
});
