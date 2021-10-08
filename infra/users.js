import database from 'infra/database.js';

export default function User() {

    async function listUsers() {
        const databaseClient = await database.getNewConnectedClient();
        try {
            const userList = databaseClient.query("SELECT  * FROM users;");
            return (await userList).rows;
        } catch (error) {
            throw error;
        } finally {
            await databaseClient.end();
        }
    }

    async function insertUser(data) {
        const databaseClient = await database.getNewConnectedClient();
        try {
            const insertList = databaseClient.query("INSERT INTO users (name, email, password) VALUES($1, $2, $3) RETURNING id;", [data.body.name, data.body.email, data.body.password]);
            return (await insertList).rows;
        } catch (error) {
            throw error;
        } finally {
            await databaseClient.end();
        }
    }

    return {
        listUsers,
        insertUser,
    };
}