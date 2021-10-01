const bancodedados = require('../bancodedados');
const {format } = require('date-fns');

let emailExistente = [];
let cpfExistente = [];
let novoNumeroConta = bancodedados.contas.length;

function verificaCpf(body) {
    bancodedados.contas.forEach(i => cpfExistente.push(i.usuario.cpf));
    if(cpfExistente.includes(body.cpf)) return {mensagem: 'Já existe uma conta com este CPF'};
}

function verificaEmail(body) {
    bancodedados.contas.forEach(i => emailExistente.push(i.usuario.email));
    if(emailExistente.includes(body.email)) return {mensagem: 'Já existe uma conta com este Email'};
}

function validaUsuario(body) {
    if(body.nome === '' || !body.nome) return {mensagem:`O campo 'nome' é obrigatório.`};
    if(body.cpf === '' || !body.cpf) return {mensagem:`O campo 'cpf' é obrigatório.`};
    if(body.data_nascimento === '' || !body.data_nascimento) return {mensagem:`O campo 'data_nascimento' é obrigatório.`};
    if(body.telefone === '' || !body.telefone) return {mensagem:`O campo 'telefone' é obrigatório.`};
    if(body.email === '' || !body.email) return {mensagem:`O campo 'email' é obrigatório.`};
    if(body.senha === '' || !body.senha) return {mensagem:`O campo 'senha' é obrigatório.`};
    if(body.cpf.length !== 11) return {mensagem: 'CPF inválido.'}; 
};

/************************************************************************************* */
 function verificaNumeroConta(numero) {
    const contaEcontrada = bancodedados.contas.find(conta => conta.numero === numero); 
    return contaEcontrada;
}
/*************************************************************************************** */
 function verificaSenha(senhaConta, senhaBody) {
    if(senhaConta !== senhaBody) return {mensagem: 'Senha incorreta.'}; 
};
/************************************************************************************* */
async function registros(num1, valor,num2) {
    const data = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

    if(!num2) return {
        data: data, 
        numero_conta: num1, 
        valor: valor
    }
    if(num2) return{
        data: data, 
        numero_conta_origem: num1, 
        numero_conta_destino: num2, 
        valor: valor
    }  
};
/************************************************************************************ */

async function consultarContas(req, res){
    if(req.query.senha_banco === '') return res.json({mensagem: 'Senha não informada.'})
    if(req.query.senha_banco !== 'Cubos123Bank') return res.json({mensagem: 'Senha incorreta.'})

    res.json(bancodedados.contas)
};

/************************************************************************************* */
async function criarConta(req, res) {
    const usuarioErro = validaUsuario(req.body);
    if (usuarioErro) return res.status(400).json(usuarioErro);

    const cpfErro = verificaCpf(req.body)
    if (cpfErro) return res.status(400).json(cpfErro);
    const emailErro = verificaEmail(req.body)
    if (emailErro) return res.status(400).json(emailErro);
        
    const dadosUsuario = {
        nome: req.body.nome,
        cpf: req.body.cpf,
        data_nascimento: req.body.data_nascimento,
        telefone: req.body.telefone,
        email: req.body.email,
        senha: req.body.senha
    }
    const novaConta = {
        numero: String(novoNumeroConta),
        saldo:0,
        usuario: dadosUsuario
    }

   novoNumeroConta++;
   bancodedados.contas.push(novaConta)
   res.status(201).json(novaConta);
};

/************************************************************************************* */ 
async function atualizarUsuarioConta(req, res) {
    const numConta = req.params.numeroConta;

    if(Object.values(req.body).length === 0) return res.status(400).json({mensagem:`Nenhum campo foi preenchido.`});

    const resposta = verificaNumeroConta(numConta);
    if(!resposta) return res.status(400).json({mensagem: 'Não existe conta com este número.'});
         
    const conta = resposta.usuario;

    if (req.body.cpf && req.body.cpf !== conta.cpf ) {
        const cpfErro = verificaCpf(req.body)
        if (cpfErro) return res.status(400).json(cpfErro);
        cpfExistente.splice(cpfExistente.indexOf(conta.cpf));
    }
    if(req.body.email && req.body.email !== conta.email){
        const emailErro = verificaEmail(req.body)
        if (emailErro) return res.status(400).json(emailErro);
        emailExistente.splice(emailExistente.indexOf(conta.email));
    }

    verificaNumeroConta(numConta).usuario = {
        nome: req.body.nome ?? conta.nome,
        cpf: req.body.cpf ?? conta.cpf,
        data_nascimento: req.body.data_nascimento ?? conta.data_nascimento,
        telefone: req.body.telefone ?? conta.telefone,
        email: req.body.email ?? conta.email,
        senha: req.body.senha ?? conta.senha
    } 
    res.status(200).json({mensagem: "Conta atualizada com sucesso!"});  
};

/************************************************************************************* */
async function excluirConta(req, res) {
    const numConta  = req.params.numeroConta;

    const resposta = verificaNumeroConta(numConta);
    if(!resposta) return res.status(400).json({mensagem: 'Não existe conta com este número.'});
    if (resposta.saldo !== 0) return res.status(400).json({mensagem: `Não é possível excluir a conta, pois o saldo é R$${resposta.saldo}.`});

    const cpf = resposta.usuario.cpf
    const email = resposta.usuario.email
    
    bancodedados.contas.splice(bancodedados.contas.indexOf(verificaNumeroConta(numConta)),1);
    cpfExistente.splice(cpfExistente.indexOf(cpf));
    emailExistente.splice(emailExistente.indexOf(email));
    return res.status(200).json({mensagem: "Conta excluída com sucesso!"});
};

/************************************************************************************* */
async function depositar(req, res) {
   const numeroConta = req.body.numero;
   const valor = req.body.valor;

    if( numeroConta === '' || valor === '') return res.status(400).json({mensagem: 'Preencha todos os campos'});
    const resposta = verificaNumeroConta(numeroConta);
    if(!resposta) return res.status(400).json({mensagem: 'Não existe conta com este número.'}) ;
         
    if (Number(valor) <= 0) return res.status(404).json({mensagem:`A operação não pode ser realizada com o valor R$${valor}.`});
   
    resposta.saldo += Number(valor);
    bancodedados.depositos.push(await registros(numeroConta, valor))
    return res.status(200).json({mensagem: 'Depósito realizado com sucesso!'});
   
};

/************************************************************************************* */
async function sacar(req, res) {
    const numeroConta = req.body.numero;
    const senhaBody = req.body.senha;
    const valor = req.body.valor;

    if( numeroConta === '' || valor === '' || senhaBody === ''){ 
        return res.status(400).json({mensagem: 'Preencha todos os campos'});
    }
    const resposta = verificaNumeroConta(numeroConta);
    if(!resposta) return res.status(400).json({mensagem: 'Não existe conta com este número.'});

    const senhaConta = resposta.usuario.senha;
    const senhaIncorreta = verificaSenha(senhaConta, senhaBody);
    if(senhaIncorreta) return res.status(400).json(senhaIncorreta);

    if (resposta.saldo >= valor) {
        resposta.saldo -= valor;
        bancodedados.saques.push(await registros(numeroConta, valor));
        return res.status(200).json({mensagem: 'Saque realizado com sucesso!'});
    }else {
        return res.status(400).json({mensagem: 'Saldo insuficiente.'})
    }
};

/************************************************************************************* */
async function tranferir(req, res) {
   const numOrigem = req.body.numero_origem;
   const numDestino = req.body.numero_destino;
   const senhaBody = req.body.senha;
   const valor = req.body.valor

   if(numOrigem === '' || numDestino === '' || senhaBody === '' || valor === '') {
        return res.status(400).json({mensagem: 'Preencha todos os campos'});
   }

   const resposta1 = verificaNumeroConta(numOrigem);
   if(!resposta1) return res.status(400).json({mensagem: 'Não existe conta com este número.'});

   const resposta2 = verificaNumeroConta(numDestino);
   if(!resposta2) return res.status(400).json({mensagem: 'Conta de destino não existe.'});

   const senhaConta = resposta1.usuario.senha;
   const senhaIncorreta = verificaSenha(senhaConta, senhaBody);
   if(senhaIncorreta) return res.status(400).json(senhaIncorreta);

   if(resposta1.saldo >= valor) {
       resposta1.saldo -= valor;
       resposta2.saldo += valor;
       bancodedados.transferencias.push(await registros(numOrigem, valor,numDestino))
       return res.status(200).json({mensagem: 'Transferência realizada com sucesso!'});
   }else {
        return res.status(400).json({mensagem: 'Saldo insuficiente'});
   }
};

/************************************************************************************* */
async function saldo(req, res) {
    const numConta = req.query.numero_conta;
    const senhaQuery = req.query.senha;
    
    if(!numConta || !senhaQuery) return res.status(400).json({mensagem: "É necessário informar o número da conta e a senha!"})
      
    const resposta = verificaNumeroConta(numConta);
    if(!resposta) return res.status(400).json({mensagem: 'Não existe conta com este número.'});

    const senhaConta = resposta.usuario.senha;
    const senhaIncorreta = verificaSenha(senhaConta, senhaQuery);
    if(senhaIncorreta) return res.status(400).json(senhaIncorreta);

    return res.status(200).json({saldo: resposta.saldo }) 
};

/************************************************************************************* */
async function extrato(req, res) {
    const numConta = req.query.numero_conta;
    const senhaQuery = req.query.senha;

    if(numConta === '' || senhaQuery ==='') return res.status(400).json({mensagem: 'É necessário informar o número da conta e a senha!'})

    const resposta = verificaNumeroConta(numConta);
    if(!resposta) return res.status(400).json({mensagem: 'Não existe conta com este número.'});

    const senhaConta = resposta.usuario.senha;
    const senhaIncorreta = verificaSenha(senhaConta, senhaQuery);
    if(senhaIncorreta) return res.status(400).json(senhaIncorreta);

    const depositos = bancodedados.depositos.filter(x => x.numero_conta === numConta);
    const saques = bancodedados.saques.filter(x => x.numero_conta === numConta);
    const transferenciasEnviadas = bancodedados.transferencias.filter(x => x.numero_conta_origem === numConta)
    const transferenciasRecebidas = bancodedados.transferencias.filter(x => x.numero_conta_destino === numConta)
    
    res.status(200).json({
        depositos: depositos, 
        saques: saques,
        transferenciasEnviadas: transferenciasEnviadas,
        transferenciasRecebidas: transferenciasRecebidas
    });
};

module.exports = {
    consultarContas,
    criarConta, 
    atualizarUsuarioConta, 
    excluirConta, 
    depositar, 
    sacar, 
    tranferir, 
    saldo, 
    extrato 
};
