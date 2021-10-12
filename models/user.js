import database from "infra/database.js";

export default function User() {

    async function getUsers() {
        try {
            const returnQuery = database.query("SELECT  * FROM users;");
            return (await returnQuery).rows;
        } catch (error) {
            throw error;
        }
    }
    async function getUser(id) {
        try {
            const returnQuery = database.query("SELECT * FROM users WHERE id = $1", [id]);
            return (await returnQuery).rows;
        } catch (error) {
            throw error;
        }
    }

    async function createUser(data) {
        const { name, email, password } = data;
        try {
            const returnQuery = database.query("INSERT INTO users (name, email, password) VALUES($1, $2, $3) RETURNING id;", [name, email, password]);
            return (await returnQuery).rows;
        } catch (error) {
            throw error;
        }
    }

    async function updateUser(id, data) {
        const { name, email, password } = data;
        try {
            const returnQuery = database.query("UPDATE users SET name = $1, email = $2, password  = $3, updated_at = timezone('utc'::text, now()) WHERE id = $4 ", [name, email, password, id]);
            return (await returnQuery).rows;
        } catch (error) {
            throw error;
        }
    }

    async function deleteUser(id) {
        try {
            const returnQuery = database.query("DELETE FROM public.users WHERE id= $1", [id]);
            return (await returnQuery).rowCount;
        } catch (error) {
            throw error;
        }
    }

    return {
        createUser,
        getUsers,
        getUser,
        updateUser,
        deleteUser
    };
}