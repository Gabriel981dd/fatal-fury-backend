const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Caminho do arquivo JSON que vai armazenar as transações
const DATA_FILE = path.join(__dirname, 'transacoes.json');

// Função para ler o arquivo JSON
function lerTransacoes() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        // Se o arquivo não existir, retorna um objeto vazio
        return {};
    }
}

// Função para escrever no arquivo JSON
function escreverTransacoes(transacoes) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(transacoes, null, 2));
}

// Rota pública: receber nova compra
app.post('/api/compras', (req, res) => {
    const compra = req.body;

    // Validação básica
    if (!compra.id || !compra.nick || !compra.product) {
        return res.status(400).json({ erro: 'Dados incompletos' });
    }

    const transacoes = lerTransacoes();
    transacoes[compra.id] = { ...compra, status: 'pending' };
    escreverTransacoes(transacoes);

    res.json({ sucesso: true, id: compra.id });
});

// Rota de login do admin
app.post('/api/login', (req, res) => {
    const { login, senha } = req.body;

    // Pega as credenciais do arquivo .env (ou usa valores padrão)
    const adminLogin = process.env.ADMIN_LOGIN || 'admin';
    const adminSenha = process.env.ADMIN_SENHA || '123456';

    if (login === adminLogin && senha === adminSenha) {
        // Cria um token JWT válido por 1 dia
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

// Middleware para verificar o token nas rotas protegidas
function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ erro: 'Token não fornecido' });

    const token = authHeader.split(' ')[1]; // Bearer <token>
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'segredo-super-seguro');
        req.usuario = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ erro: 'Token inválido' });
    }
}

// Rota protegida: listar todas as transações (apenas admin)
app.get('/api/admin/transacoes', verificarToken, (req, res) => {
    const transacoes = lerTransacoes();
    res.json(transacoes);
});

// Rota protegida: atualizar status de uma transação
app.put('/api/admin/transacoes/:id', verificarToken, (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' ou 'rejected'

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

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
