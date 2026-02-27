const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'transacoes.json');

function lerTransacoes() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

function escreverTransacoes(transacoes) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(transacoes, null, 2));
}

app.get('/', (req, res) => {
    res.send('🚀 Servidor Fatal Fury está funcionando!');
});

app.post('/api/compras', (req, res) => {
    const compra = req.body;
    if (!compra.id || !compra.nick || !compra.product) {
        return res.status(400).json({ erro: 'Dados incompletos' });
    }
    const transacoes = lerTransacoes();
    transacoes[compra.id] = { ...compra, status: 'pending' };
    escreverTransacoes(transacoes);
    res.json({ sucesso: true, id: compra.id });
});

app.get('/api/compras/:id', (req, res) => {
    const { id } = req.params;
    const transacoes = lerTransacoes();
    if (transacoes[id]) {
        const { nick, product, price, status, timestamp } = transacoes[id];
        res.json({ nick, product, price, status, timestamp });
    } else {
        res.status(404).json({ erro: 'Transação não encontrada' });
    }
});

app.post('/api/login', (req, res) => {
    const { login, senha } = req.body;
    const adminLogin = process.env.ADMIN_LOGIN || '3Fb3BJGLpaAhZ9kWdQOpfPtI';
    const adminSenha = process.env.ADMIN_SENHA || 'uiIaiTD4qWWgol7VF5YFl2eQ';
    if (login === adminLogin && senha === adminSenha) {
        const token = jwt.sign(
            { role: 'admin' },
            process.env.JWT_SECRET || 'segredo-super-seguro',
            { expiresIn: '1d' }
        );
        res.json({ token });
    } else {
        res.status(401).json({ erro: 'Credenciais inválidas' });
    }
});

function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ erro: 'Token não fornecido' });
    const token = authHeader.split(' ')[1];
    try {
        jwt.verify(token, process.env.JWT_SECRET || 'segredo-super-seguro');
        next();
    } catch (err) {
        return res.status(403).json({ erro: 'Token inválido' });
    }
}

app.get('/api/admin/transacoes', verificarToken, (req, res) => {
    const transacoes = lerTransacoes();
    res.json(transacoes);
});

app.put('/api/admin/transacoes/:id', verificarToken, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ erro: 'Status inválido' });
    }
    const transacoes = lerTransacoes();
    if (!transacoes[id]) {
        return res.status(404).json({ erro: 'Transação não encontrada' });
    }
    transacoes[id].status = status;
    escreverTransacoes(transacoes);
    res.json({ sucesso: true });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
