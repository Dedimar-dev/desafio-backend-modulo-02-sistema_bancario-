const express = require('express');
const controladores = require('./controladores/controladores')

const rotas = express();

rotas.get('/contas', controladores.consultarContas);
rotas.post('/contas', controladores.criarConta);
rotas.put('/contas/:numeroConta/usuario', controladores.atualizarUsuarioConta);
rotas.delete('/contas/:numeroConta', controladores.excluirConta);
rotas.post('/transacoes/depositar', controladores.depositar);
rotas.post('/transacoes/sacar', controladores.sacar);
rotas.post('/transacoes/transferir', controladores.tranferir);
rotas.get('/contas/saldo', controladores.saldo);
rotas.get('/contas/extrato', controladores.extrato);


module.exports = rotas;
