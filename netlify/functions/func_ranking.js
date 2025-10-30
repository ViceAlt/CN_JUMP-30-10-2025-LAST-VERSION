const { Pool } = require('pg');

// Configuração do pool de conexões
let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('URL de conexão com o banco de dados não configurada');
    }
    
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}

exports.handler = async (event) => {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Responder a requisições OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const dbPool = getPool();

    if (event.httpMethod === 'POST') {
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Corpo da requisição vazio' })
        };
      }

      const { nome, score } = JSON.parse(event.body);
      
      if (!nome || typeof nome !== 'string' || nome.trim() === '') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Nome é obrigatório' })
        };
      }

      if (typeof score !== 'number' || isNaN(score)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Score deve ser um número válido' })
        };
      }

      await dbPool.query('INSERT INTO toonjumpranking (nome, score) VALUES ($1, $2)', [nome.trim(), score]);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Score salvo com sucesso!' })
      };
    }

    if (event.httpMethod === 'GET') {
      const result = await dbPool.query('SELECT nome, score FROM toonjumpranking ORDER BY score DESC LIMIT 10');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows)
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };

  } catch (error) {
    console.error('Erro na função func_ranking:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Tente novamente mais tarde'
      })
    };
  }
};