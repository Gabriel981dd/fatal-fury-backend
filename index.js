const express = require('express');
const Database = require('@replit/database');
const path = require('path');
const app = express();
const db = new Database();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, './')));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API: Salvar transação
app.post('/api/save-transaction', async (req, res) => {
  try {
    const data = req.body;
    await db.set(`transaction_${data.id}`, data);
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// API: Verificar status
app.get('/api/check-status/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const data = await db.get(`transaction_${id}`);
    res.json({ status: data ? data.status : 'pending' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// API: Atualizar status
app.post('/api/update-status', async (req, res) => {
  try {
    const { id, status } = req.body;
    const data = await db.get(`transaction_${id}`);
    if (data) {
      data.status = status;
      await db.set(`transaction_${id}`, data);
    }
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// INICIAR SERVIDOR (24 HORAS)
// ===============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});