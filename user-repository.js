import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import DBLocal from 'db-local';
import { SALT_ROUNDS } from './config.js';


const { Schema } = new DBLocal({ path: './db' });

const User = Schema('User', {
    _id: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
});

export class UserRepository {
    static async create ({ username, password }) {
        //1. validaciones de username ( opc: zod )
        if ( typeof username != 'string' ) throw new Error('username must be a string');
        if ( username.length < 3 ) throw new Error('username must be at leat 3 characters long');
        
        if ( typeof password != 'string' ) throw new Error('password must be a string');
        if ( password.length < 6 ) throw new Error('password must be at leat 6 characters long');

        //2. Asegurarse que el username no existe
        const user = User.findOne({ username });
        if ( user ) throw new Error('username already exists');

        const id = crypto.randomUUID();
        // const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS); // bloquea el thread principal
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS); // asincrona pero devuelve una promesa

        User.create({
            _id: id,
            username,
            password: hashedPassword
        }).save();

        return id;
    }

    static login ({ username, password }) {}
}