const modalRanking = document.getElementById('modal-ranking');
const listaRanking = document.getElementById('lista-ranking');
const estadoRanking = document.getElementById('estado-ranking');
const ENDPOINT_RANKING = '/.netlify/functions/func_ranking';

function abrirModalRanking() {
	if (!modalRanking) return;
	modalRanking.style.display = 'flex';
	carregarRanking();
}

function fecharModalRanking() {
	if (!modalRanking) return;
	modalRanking.style.display = 'none';
}

async function carregarRanking() {
	if (!listaRanking || !estadoRanking) return;

	listaRanking.innerHTML = '';
	estadoRanking.textContent = 'Carregando...';
	estadoRanking.style.display = 'block';

	try {
		console.log('Fazendo requisição para:', ENDPOINT_RANKING);
		
		const resposta = await fetch(ENDPOINT_RANKING, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		
		console.log('Status da resposta:', resposta.status);
		
		if (!resposta.ok) {
			const textoErro = await resposta.text();
			console.error('Erro na resposta:', textoErro);
			throw new Error(`Erro ${resposta.status}: ${textoErro}`);
		}

		const dados = await resposta.json();
		console.log('Dados recebidos:', dados);

		if (!Array.isArray(dados) || dados.length === 0) {
			estadoRanking.textContent = 'Ainda não há pontuações.';
			return;
		}

		estadoRanking.style.display = 'none';

		dados.forEach((item, indice) => {
			const li = document.createElement('li');
			const nome = item.nome ?? 'Sem nome';
			const pontos = Number(item.score) || 0;
			li.innerHTML = `<span>${indice + 1}º - ${nome}</span><span>${pontos}</span>`;
			listaRanking.appendChild(li);
		});
	} catch (erro) {
		console.error('Erro ao carregar ranking:', erro);
		estadoRanking.textContent = `Erro ao carregar ranking: ${erro.message}`;
	}
}

window.addEventListener('click', (evento) => {
	if (evento.target === modalRanking) {
		fecharModalRanking();
	}
});

window.addEventListener('keydown', (evento) => {
	if (evento.key === 'Escape') {
		fecharModalRanking();
	}
});

async function salvarScoreRanking(nomeJogador, pontuacao) {
	const nome = (nomeJogador || '').trim();
	if (!nome) {
		console.warn('Nome do jogador não informado');
		return;
	}

	const score = Number(pontuacao) || 0;
	if (score <= 0) {
		console.warn('Pontuação inválida:', pontuacao);
		return;
	}

	try {
		console.log('Salvando score:', { nome, score });
		
		const resposta = await fetch(ENDPOINT_RANKING, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ nome, score })
		});

		if (!resposta.ok) {
			const textoErro = await resposta.text();
			console.error('Erro ao salvar score:', textoErro);
			throw new Error(`Erro ${resposta.status}: ${textoErro}`);
		}

		const resultado = await resposta.json();
		console.log('Score salvo com sucesso:', resultado);
		
	} catch (erro) {
		console.error('Erro ao salvar score no ranking:', erro);
	}
}

window.salvarScoreRanking = salvarScoreRanking;