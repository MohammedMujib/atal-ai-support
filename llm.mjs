const groqModel = () => process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const openRouterModel = () => process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-maverick';

export function modelStatus() {
  const groq = Boolean(process.env.GROQ_API_KEY);
  const backup = Boolean(process.env.OPENROUTER_API_KEY);
  return {
    connected: groq || backup,
    ready: groq,
    loaded: groq,
    model: groq ? groqModel() : openRouterModel(),
    provider: groq ? 'groq' : backup ? 'openrouter' : 'unconfigured',
    fallback: backup ? 'openrouter' : ''
  };
}

function providers() {
  const list = [];
  if (process.env.GROQ_API_KEY) {
    list.push({ name: 'groq', url: 'https://api.groq.com/openai/v1/chat/completions', key: process.env.GROQ_API_KEY, model: groqModel() });
  }
  if (process.env.OPENROUTER_API_KEY) {
    list.push({
      name: 'openrouter',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: process.env.OPENROUTER_API_KEY,
      model: openRouterModel(),
      headers: { 'HTTP-Referer': 'http://127.0.0.1:3002', 'X-Title': 'Atal' }
    });
  }
  if (!list.length) list.push({ name: 'unconfigured', url: 'http://127.0.0.1:9/unavailable', key: '', model: groqModel() });
  return list;
}

function replyText(payload) {
  if (typeof payload?.message?.content === 'string') return { content: payload.message.content, doneReason: payload.done_reason || '' };
  const choice = payload?.choices?.[0];
  return { content: choice?.message?.content || '', doneReason: choice?.finish_reason || '' };
}

export async function completeChat(messages, { temperature = 0.2, maxTokens = 420, signal } = {}) {
  let lastError;
  for (const target of providers()) {
    try {
      const response = await fetch(target.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(target.key ? { Authorization: `Bearer ${target.key}` } : {}), ...(target.headers || {}) },
        signal,
        body: JSON.stringify({ model: target.model, messages, temperature, max_tokens: maxTokens, stream: false, response_format: { type: 'json_object' } })
      });
      if (!response.ok) {
        lastError = Object.assign(new Error('http'), { status: response.status === 404 ? 503 : 502, code: 'assistantUnavailable', kind: response.status === 404 ? 'model_missing' : 'http' });
        continue;
      }
      const payload = await response.json();
      const { content, doneReason } = replyText(payload);
      return { content, doneReason, provider: target.name, stats: { loadMs: null, promptMs: null, evalMs: null, doneReason } };
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      lastError = Object.assign(error, { status: 503, code: 'assistantUnavailable', kind: error.name === 'TimeoutError' ? 'timeout' : 'connection' });
    }
  }
  throw lastError || Object.assign(new Error('unconfigured'), { status: 503, code: 'assistantUnavailable', kind: 'connection' });
}
