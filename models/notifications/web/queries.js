import { NotFoundError } from 'errors';
import database from 'infra/database';

async function findOneById(id) {
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
    values: [id],
  };

  try {
    const result = await database.query(query);
    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: `Notificação com o ID "${id}" não encontrada.`,
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

async function updateOneStatusById(status, id) {
  const query = {
    text: `
      UPDATE
        user_notifications
      SET
        status = $1,
        updated_at = NOW() AT TIME ZONE 'utc'
      WHERE
        id = $2
      RETURNING
        id,
        status
    `,
    values: [status, id],
  };

  try {
    const result = await database.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao atualizar status da notificação para "read":', error);
    throw error;
  }
}

async function updateAllStatusByUserId(status, id) {
  const query = {
    text: `
      UPDATE
        user_notifications
      SET
        status = $1,
        updated_at = NOW() AT TIME ZONE 'utc'
      WHERE
        recipient_id = $2
      AND 
        status != 'draft'
      RETURNING
        id,
        status
    `,
    values: [status, id],
  };

  try {
    const result = await database.query(query);
    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: `Nenhuma notificação encontrada para o usuário com ID "${id}".`,
        action: 'Verifique se o ID está correto e se existem notificações para o usuário.',
        stack: new Error().stack,
        errorLocationCode: 'MODEL:NOTIFICATIONS:UPDATE_ALL_BY_USER_ID:NOT_FOUND',
        key: 'recipient_id',
      });
    }
    return result.rows;
  } catch (error) {
    console.error('Erro ao atualizar notificações do usuário:', error);
    throw error;
  }
}

async function findAllCountByUserId(id) {
  const query = {
    text: `
      SELECT
        COUNT(*)
      FROM
        user_notifications
      WHERE
        recipient_id = $1
      AND status != 'draft'
    `,
    values: [id],
  };

  try {
    const result = await database.query(query);
    const count = parseInt(result.rows[0].count, 10);

    if (count === 0) {
      throw new NotFoundError({
        message: `Nenhuma notificação encontrada para o usuário com ID "${id}".`,
        action: 'Verifique se o ID está correto e se existem notificações para o usuário.',
        stack: new Error().stack,
        errorLocationCode: 'MODEL:NOTIFICATIONS:CHECK_IF_NOTIFICATIONS_EXIST_FOR_USER:NOT_FOUND',
        key: 'recipient_id',
      });
    }

    return count;
  } catch (error) {
    console.error('Erro ao verificar se existem notificações para o usuário:', error);
    throw error;
  }
}

async function findAllByUserId(id) {
  const query = {
    text: `
      SELECT
        *
      FROM
        user_notifications
      WHERE
        recipient_id = $1
      AND status != 'draft'
    `,
    values: [id],
  };

  try {
    const result = await database.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError({
        message: `Nenhuma notificação encontrada para o usuário com ID "${id}".`,
        action: 'Verifique se o ID está correto e se existem notificações para o usuário.',
        stack: new Error().stack,
        errorLocationCode: 'MODEL:NOTIFICATIONS:CHECK_IF_NOTIFICATIONS_EXIST_FOR_USER:NOT_FOUND',
        key: 'recipient_id',
      });
    }

    return result.rows;
  } catch (error) {
    console.error('Erro ao verificar se existem notificações para o usuário:', error);
    throw error;
  }
}

async function findOneByUserId(id) {
  const query = {
    text: `
      SELECT
        *
      FROM
        user_notifications
      WHERE
        recipient_id = $1
      AND status != 'draft'
      LIMIT 1
    `,
    values: [id],
  };

  try {
    const result = await database.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError({
        message: `Nenhuma notificação encontrada para o usuário com ID "${id}".`,
        action: 'Verifique se o ID está correto e se existem notificações para o usuário.',
        stack: new Error().stack,
        errorLocationCode: 'MODEL:NOTIFICATIONS:CHECK_IF_NOTIFICATIONS_EXIST_FOR_USER:NOT_FOUND',
        key: 'recipient_id',
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
  findOneByUserId,
  findAllByUserId,
  findAllCountByUserId,
  updateOneStatusById,
  updateAllStatusByUserId,
});
