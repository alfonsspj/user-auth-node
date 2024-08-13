import express from 'express';
import { PORT } from './config.js';
import { UserRepository } from './user-repository.js';

const app = express();

// Indicar que sistema de plantillas se va a usar
app.set('view engine', 'ejs');

app.use(express.json()); // middleware: transforma el cuerpo del body en json

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/protected', (req, res) => {
    // todo: if sesión del usuario
    res.render('protected');
    // todo: else 401
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await UserRepository.login({ username, password });
        res.send({ user });
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

app.post('/logout', (req, res) => {});

app.get('/protected', (req, res) => {});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});