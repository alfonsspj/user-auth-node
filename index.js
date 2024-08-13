import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { PORT, SECRET_JWT_KEY } from './config.js';
import { UserRepository } from './user-repository.js';

const app = express();

// Indicar que sistema de plantillas se va a usar
app.set('view engine', 'ejs');

app.use(express.json()); // middleware: transforma el cuerpo del body en json
app.use(cookieParser());

app.use((req, res, next) => {
    const token = req.cookies.access_token;

    // añadir información a la petición para poder acceder a la propiedad en cualquier end point más adelante
    req.session = { user: null };

    try {
        const data = jwt.verify(token, SECRET_JWT_KEY);
        req.session.user = data;
    } catch {}

    next();
});

app.get('/', (req, res) => {
    const { user } = req.session;
    res.render('index', user);
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await UserRepository.login({ username, password });
        const token = jwt.sign(
            { id: user._id, username: user.username }, 
            SECRET_JWT_KEY,
            { expiresIn: '1h'}
        );

        // refresh token y tambien hay que guardarlo en una cookie- hay que renovarlo cada cierto tiempo
        const refreshToken = jwt.sign(
            { id: user._id, username: user.username }, 
            SECRET_JWT_KEY,
            { expiresIn: '7d'}
        );

        res.cookie('access_token', token, {
                httpOnly: true, // la cookie solo se puede acceder en el servidor
                secure: process.env.NODE_ENV === 'production', // solo se puede acceder en https
                sameSite: 'strict', // solo se puede acceder en el mismo dominio
                maxAge: 1000 * 60 * 60 // tiempo de validez de 1 hora
            })
           .send({ user, token });
    } catch (error) {
        res.status(401).send(error.message);
    }
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    console.log({ username, password }); 

    try {
        const id = await UserRepository.create({ username, password });
        res.send({ id })
    } catch (error) {
        // normalmente no es buena idea mandar el error del repository(no mandar info de db)
        res.status(400).send(error.message);
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('access_token')
       .json({ message: 'Logout successful' });
});

app.get('/protected', (req, res) => {
    const { user } = req.session;
    if (!user) return res.status(403).send('Access not authorized');   

    res.render('protected', user); // { _id, username }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});