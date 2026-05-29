/* =====================================================
   AI Daily Hub — app.js
   Seeded daily content, streak tracking, search/filter
   ===================================================== */

const STORAGE_KEY = 'ai-daily-hub';
const TRENDING_CACHE_KEY = 'ai-trending-cache';

// ─── Seeded PRNG (Mulberry32) ───────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function getDailySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── LocalStorage helpers ────────────────────────────
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch { return {}; }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Streak logic ─────────────────────────────────────
function updateStreak(state) {
  const today = getTodayString();
  const yesterday = getYesterdayString();

  if (state.lastVisit === today) return state;

  const newState = { ...state };
  if (state.lastVisit === yesterday) {
    newState.streak = (state.streak || 0) + 1;
  } else if (!state.lastVisit) {
    newState.streak = 1;
  } else {
    newState.streak = 1;
  }
  newState.lastVisit = today;
  newState.visitHistory = [...(state.visitHistory || []), today].slice(-90);
  return newState;
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Daily content selection ──────────────────────────
function selectDailyContent(items) {
  const rng = mulberry32(getDailySeed());
  const categories = ['framework', 'agent', 'sap-ai', 'paper', 'repo', 'concept'];

  const featured = [];
  const usedIds = new Set();

  for (const cat of categories) {
    const pool = items.filter(i => i.category === cat);
    if (!pool.length) continue;
    const shuffled = seededShuffle(pool, mulberry32(getDailySeed() + cat.charCodeAt(0)));
    featured.push(shuffled[0]);
    usedIds.add(shuffled[0].id);
  }

  const remaining = seededShuffle(items.filter(i => !usedIds.has(i.id)), rng);
  const bonus = remaining.slice(0, 4);

  return { featured, bonus };
}

// ─── Card HTML renderer ──────────────────────────────
const CATEGORY_LABELS = {
  framework: 'Framework',
  agent: 'AI Agent',
  'sap-ai': 'SAP AI',
  paper: 'Research',
  repo: 'Repository',
  concept: 'Core Concept'
};

function renderCard(item, state, opts = {}) {
  const learned = (state.learned || []).includes(item.id);
  const classes = ['card', `cat-${item.category}`, learned ? 'learned' : '', opts.featured ? 'card-featured' : ''].filter(Boolean).join(' ');

  const tags = (item.tags || []).slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('');
  const stars = item.stars ? `<span class="trending-stars">⭐ ${item.stars}</span>` : '';
  const dailyLabel = opts.featured ? `<span class="daily-label">Today's Pick</span>` : '';

  return `
    <article class="${classes}" data-id="${item.id}" data-cat="${item.category}">
      ${dailyLabel}
      <div class="card-inner">
        <div class="card-header">
          <div class="card-emoji-wrap">${item.emoji || '🤖'}</div>
          <div class="card-meta">
            <span class="card-category">${CATEGORY_LABELS[item.category] || item.category}</span>
          </div>
          <div class="card-actions">
            <button class="btn-icon learned-btn ${learned ? 'active' : ''}" data-id="${item.id}" title="${learned ? 'Mark unlearned' : 'Mark as learned'}">
              ${learned ? '✅' : '○'}
            </button>
          </div>
        </div>
        <h3 class="card-title">${escHtml(item.title)}</h3>
        <p class="card-desc">${escHtml(item.description)}</p>
        ${tags ? `<div class="card-tags">${tags}</div>` : ''}
        <div class="card-footer">
          <span class="difficulty-badge diff-${item.difficulty}">${item.difficulty}</span>
          ${stars}
          <a class="card-link" href="${item.url}" target="_blank" rel="noopener noreferrer">
            Explore →
          </a>
        </div>
      </div>
    </article>`;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Trending repos (curated — 100 items) ────────────
// cat: llm | agent | rag | tools | sap-ai
// rising: true = newer fast-growing repo
const CURATED_TRENDING = [
  { name: 'ollama/ollama', desc: 'Get up and running with large language models locally', stars: '100k+', url: 'https://github.com/ollama/ollama', cat: 'llm', rising: true },
  { name: 'langchain-ai/langchain', desc: 'Build context-aware reasoning applications with LangChain', stars: '95k+', url: 'https://github.com/langchain-ai/langchain', cat: 'rag' },
  { name: 'langgenius/dify', desc: 'Open-source LLM app development platform with visual workflow', stars: '80k+', url: 'https://github.com/langgenius/dify', cat: 'tools', rising: true },
  { name: 'open-webui/open-webui', desc: 'User-friendly AI interface supporting Ollama and OpenAI', stars: '50k+', url: 'https://github.com/open-webui/open-webui', cat: 'tools', rising: true },
  { name: 'FlowiseAI/Flowise', desc: 'Drag & drop UI to build your customized LLM flow', stars: '35k+', url: 'https://github.com/FlowiseAI/Flowise', cat: 'tools', rising: true },
  { name: 'vllm-project/vllm', desc: 'High-throughput and memory-efficient LLM serving engine', stars: '40k+', url: 'https://github.com/vllm-project/vllm', cat: 'llm', rising: true },
  { name: 'microsoft/autogen', desc: 'Multi-agent conversation framework for complex task automation', stars: '40k+', url: 'https://github.com/microsoft/autogen', cat: 'agent' },
  { name: 'microsoft/graphrag', desc: 'LLM-powered knowledge graph for advanced retrieval', stars: '20k+', url: 'https://github.com/microsoft/graphrag', cat: 'rag', rising: true },
  { name: 'BerriAI/litellm', desc: 'Call all LLM APIs using the OpenAI format', stars: '15k+', url: 'https://github.com/BerriAI/litellm', cat: 'tools', rising: true },
  { name: 'ggerganov/llama.cpp', desc: 'LLM inference in C/C++ with GGUF quantization support', stars: '70k+', url: 'https://github.com/ggerganov/llama.cpp', cat: 'llm' },
  { name: 'huggingface/transformers', desc: 'State-of-the-art machine learning for PyTorch, TensorFlow, and JAX', stars: '135k+', url: 'https://github.com/huggingface/transformers', cat: 'llm' },
  { name: 'langchain-ai/langgraph', desc: 'Build stateful, multi-actor applications with LLMs', stars: '10k+', url: 'https://github.com/langchain-ai/langgraph', cat: 'agent', rising: true },
  { name: 'mem0ai/mem0', desc: 'Memory layer for AI agents and assistants', stars: '25k+', url: 'https://github.com/mem0ai/mem0', cat: 'rag', rising: true },
  { name: 'n8n-io/n8n', desc: 'Workflow automation tool with native AI agent nodes', stars: '50k+', url: 'https://github.com/n8n-io/n8n', cat: 'tools', rising: true },
  { name: 'ComposioHQ/composio', desc: '250+ managed integrations and tools for AI agents', stars: '15k+', url: 'https://github.com/ComposioHQ/composio', cat: 'agent', rising: true },
  { name: 'jxnl/instructor', desc: 'Structured LLM outputs with Pydantic validation', stars: '10k+', url: 'https://github.com/jxnl/instructor', cat: 'tools', rising: true },
  { name: 'openai/openai-python', desc: 'Official Python library for the OpenAI API', stars: '24k+', url: 'https://github.com/openai/openai-python', cat: 'tools' },
  { name: 'anthropics/anthropic-sdk-python', desc: 'Official Python SDK for the Anthropic Claude API', stars: '3k+', url: 'https://github.com/anthropics/anthropic-sdk-python', cat: 'tools' },
  { name: 'run-llama/llama_index', desc: 'LlamaIndex — data framework for LLM applications', stars: '38k+', url: 'https://github.com/run-llama/llama_index', cat: 'rag' },
  { name: 'chroma-core/chroma', desc: 'The AI-native open-source embedding database', stars: '16k+', url: 'https://github.com/chroma-core/chroma', cat: 'rag' },
  { name: 'qdrant/qdrant', desc: 'High-performance vector search engine written in Rust', stars: '22k+', url: 'https://github.com/qdrant/qdrant', cat: 'rag' },
  { name: 'microsoft/semantic-kernel', desc: 'Integrate AI models into .NET, Python, and Java apps', stars: '23k+', url: 'https://github.com/microsoft/semantic-kernel', cat: 'agent' },
  { name: 'crewAIInc/crewAI', desc: 'Framework for orchestrating role-playing AI agents', stars: '28k+', url: 'https://github.com/crewAIInc/crewAI', cat: 'agent', rising: true },
  { name: 'openai/swarm', desc: 'Lightweight multi-agent orchestration framework by OpenAI', stars: '18k+', url: 'https://github.com/openai/swarm', cat: 'agent', rising: true },
  { name: 'stanfordnlp/dspy', desc: 'Programming language model pipelines with auto-optimization', stars: '20k+', url: 'https://github.com/stanfordnlp/dspy', cat: 'agent', rising: true },
  { name: 'pydantic/pydantic-ai', desc: 'Type-safe agent framework built on Pydantic', stars: '8k+', url: 'https://github.com/pydantic/pydantic-ai', cat: 'agent', rising: true },
  { name: 'huggingface/smolagents', desc: 'Minimal code-first agent library by Hugging Face', stars: '12k+', url: 'https://github.com/huggingface/smolagents', cat: 'agent', rising: true },
  { name: 'deepset-ai/haystack', desc: 'Production-ready NLP framework for search and QA', stars: '18k+', url: 'https://github.com/deepset-ai/haystack', cat: 'rag' },
  { name: 'agno-agi/agno', desc: 'Full-stack agent framework with memory and knowledge', stars: '20k+', url: 'https://github.com/agno-agi/agno', cat: 'agent', rising: true },
  { name: 'Significant-Gravitas/AutoGPT', desc: 'The vision of accessible AI for everyone', stars: '172k+', url: 'https://github.com/Significant-Gravitas/AutoGPT', cat: 'agent' },
  { name: 'gpt-engineer-org/gpt-engineer', desc: 'Platform to experiment with AI-driven software engineers', stars: '52k+', url: 'https://github.com/gpt-engineer-org/gpt-engineer', cat: 'agent' },
  { name: 'Stability-AI/stablediffusion', desc: 'High-resolution image synthesis with latent diffusion models', stars: '39k+', url: 'https://github.com/Stability-AI/stablediffusion', cat: 'llm' },
  { name: 'AUTOMATIC1111/stable-diffusion-webui', desc: 'Stable Diffusion web UI with dozens of features', stars: '144k+', url: 'https://github.com/AUTOMATIC1111/stable-diffusion-webui', cat: 'tools' },
  { name: 'openai/whisper', desc: 'Robust speech recognition via large-scale weak supervision', stars: '74k+', url: 'https://github.com/openai/whisper', cat: 'llm' },
  { name: 'facebookresearch/llama', desc: 'Inference code for Meta Llama models', stars: '57k+', url: 'https://github.com/facebookresearch/llama', cat: 'llm' },
  { name: 'mistralai/mistral-src', desc: 'Reference implementation of Mistral AI models', stars: '9k+', url: 'https://github.com/mistralai/mistral-src', cat: 'llm' },
  { name: 'tatsu-lab/stanford_alpaca', desc: 'Stanford Alpaca: instruction-following LLaMA model', stars: '29k+', url: 'https://github.com/tatsu-lab/stanford_alpaca', cat: 'llm' },
  { name: 'imartinez/privateGPT', desc: 'Interact with documents privately using LLMs', stars: '54k+', url: 'https://github.com/imartinez/privateGPT', cat: 'rag' },
  { name: 'getzep/zep', desc: 'Long-term memory store for AI assistant applications', stars: '3k+', url: 'https://github.com/getzep/zep', cat: 'rag' },
  { name: 'weaviate/weaviate', desc: 'Cloud-native AI-native vector database', stars: '12k+', url: 'https://github.com/weaviate/weaviate', cat: 'rag' },
  { name: 'pinecone-io/pinecone-python-client', desc: 'Official Python client for Pinecone vector database', stars: '2k+', url: 'https://github.com/pinecone-io/pinecone-python-client', cat: 'rag' },
  { name: 'pytorch/pytorch', desc: 'Tensors and dynamic neural networks in Python', stars: '83k+', url: 'https://github.com/pytorch/pytorch', cat: 'llm' },
  { name: 'tensorflow/tensorflow', desc: 'End-to-end open source platform for machine learning', stars: '186k+', url: 'https://github.com/tensorflow/tensorflow', cat: 'llm' },
  { name: 'keras-team/keras', desc: 'Deep learning for humans — multi-backend Keras 3', stars: '62k+', url: 'https://github.com/keras-team/keras', cat: 'llm' },
  { name: 'openai/evals', desc: 'Evaluation framework for LLMs and LLM systems', stars: '14k+', url: 'https://github.com/openai/evals', cat: 'tools' },
  { name: 'microsoft/TaskWeaver', desc: 'Code-first agent framework for data analytics tasks', stars: '5k+', url: 'https://github.com/microsoft/TaskWeaver', cat: 'agent', rising: true },
  { name: 'agentops-ai/agentops', desc: 'Python SDK for AI agent observability and testing', stars: '3k+', url: 'https://github.com/agentops-ai/agentops', cat: 'tools', rising: true },
  { name: 'hwchase17/langchain', desc: 'LangChain original repository — building LLM apps', stars: '10k+', url: 'https://github.com/hwchase17/langchain', cat: 'rag' },
  { name: 'openai/chatgpt-retrieval-plugin', desc: 'ChatGPT retrieval plugin for semantic document search', stars: '21k+', url: 'https://github.com/openai/chatgpt-retrieval-plugin', cat: 'rag' },
  { name: 'openai/openai-cookbook', desc: 'Examples and guides for using the OpenAI API', stars: '60k+', url: 'https://github.com/openai/openai-cookbook', cat: 'tools' },
  { name: 'Hannibal046/Awesome-LLM', desc: 'Curated list of large language model papers and resources', stars: '18k+', url: 'https://github.com/Hannibal046/Awesome-LLM', cat: 'llm' },
  { name: 'f/awesome-chatgpt-prompts', desc: 'Collection of ChatGPT prompt curation', stars: '116k+', url: 'https://github.com/f/awesome-chatgpt-prompts', cat: 'tools' },
  { name: 'dair-ai/Prompt-Engineering-Guide', desc: 'Guides and resources for prompt engineering', stars: '51k+', url: 'https://github.com/dair-ai/Prompt-Engineering-Guide', cat: 'tools' },
  { name: 'mlabonne/llm-course', desc: 'Course to get into large language models with roadmap', stars: '40k+', url: 'https://github.com/mlabonne/llm-course', cat: 'llm' },
  { name: 'microsoft/promptflow', desc: 'Build high-quality LLM apps with Azure AI', stars: '9k+', url: 'https://github.com/microsoft/promptflow', cat: 'tools', rising: true },
  { name: 'run-llama/llama-hub', desc: 'Library of data loaders for LlamaIndex and LangChain', stars: '3k+', url: 'https://github.com/run-llama/llama-hub', cat: 'rag' },
  { name: 'hwchase17/chroma', desc: 'Open-source embedding database for AI applications', stars: '2k+', url: 'https://github.com/hwchase17/chroma', cat: 'rag' },
  { name: 'milvus-io/milvus', desc: 'Vector database for scalable similarity search', stars: '31k+', url: 'https://github.com/milvus-io/milvus', cat: 'rag' },
  { name: 'jerryjliu/gpt_index', desc: 'GPT Index — original LlamaIndex repository', stars: '4k+', url: 'https://github.com/jerryjliu/gpt_index', cat: 'rag' },
  { name: 'facebookresearch/faiss', desc: 'Efficient similarity search and clustering of dense vectors', stars: '32k+', url: 'https://github.com/facebookresearch/faiss', cat: 'rag' },
  { name: 'neuml/txtai', desc: 'All-in-one open-source embeddings database', stars: '9k+', url: 'https://github.com/neuml/txtai', cat: 'rag' },
  { name: 'togethercomputer/OpenChatKit', desc: 'OpenChatKit — open-source base for chat applications', stars: '9k+', url: 'https://github.com/togethercomputer/OpenChatKit', cat: 'llm' },
  { name: 'guidance-ai/guidance', desc: 'Guidance language for controlling LLMs effectively', stars: '19k+', url: 'https://github.com/guidance-ai/guidance', cat: 'llm' },
  { name: 'outlines-dev/outlines', desc: 'Structured text generation with regex and JSON schemas', stars: '10k+', url: 'https://github.com/outlines-dev/outlines', cat: 'tools', rising: true },
  { name: 'microsoft/LoRA', desc: 'LoRA: Low-Rank Adaptation of Large Language Models', stars: '10k+', url: 'https://github.com/microsoft/LoRA', cat: 'llm' },
  { name: 'huggingface/peft', desc: 'Parameter-efficient fine-tuning of large models', stars: '16k+', url: 'https://github.com/huggingface/peft', cat: 'llm', rising: true },
  { name: 'huggingface/trl', desc: 'Train LLMs with reinforcement learning (PPO, DPO, RLHF)', stars: '10k+', url: 'https://github.com/huggingface/trl', cat: 'llm', rising: true },
  { name: 'lm-sys/FastChat', desc: 'Open platform for training and evaluating LLM chatbots', stars: '37k+', url: 'https://github.com/lm-sys/FastChat', cat: 'llm' },
  { name: 'Ray-project/ray', desc: 'AI compute engine for distributed ML workloads', stars: '34k+', url: 'https://github.com/ray-project/ray', cat: 'tools' },
  { name: 'mlflow/mlflow', desc: 'Platform for ML lifecycle including LLM tracking', stars: '19k+', url: 'https://github.com/mlflow/mlflow', cat: 'tools' },
  { name: 'BerriAI/cooldown', desc: 'Rate-limiting and caching middleware for LLM APIs', stars: '1k+', url: 'https://github.com/BerriAI/litellm', cat: 'tools' },
  { name: 'ankane/neighbor', desc: 'Nearest neighbor search for Rails with pgvector support', stars: '2k+', url: 'https://github.com/ankane/neighbor', cat: 'rag' },
  { name: 'pgvector/pgvector', desc: 'Open-source vector similarity search for Postgres', stars: '13k+', url: 'https://github.com/pgvector/pgvector', cat: 'rag', rising: true },
  { name: 'activeloopai/deeplake', desc: 'Database for AI — store, query, and train on any data', stars: '8k+', url: 'https://github.com/activeloopai/deeplake', cat: 'rag' },
  { name: 'openai/triton', desc: 'Development repository for Triton compiler and language', stars: '13k+', url: 'https://github.com/openai/triton', cat: 'llm' },
  { name: 'openai/CLIP', desc: 'Contrastive Language-Image Pretraining by OpenAI', stars: '24k+', url: 'https://github.com/openai/CLIP', cat: 'llm' },
  { name: 'facebookresearch/segment-anything', desc: 'Segment Anything Model (SAM) by Meta AI', stars: '46k+', url: 'https://github.com/facebookresearch/segment-anything', cat: 'llm' },
  { name: 'google-research/bert', desc: 'TensorFlow code for BERT pre-training and fine-tuning', stars: '38k+', url: 'https://github.com/google-research/bert', cat: 'llm' },
  { name: 'karpathy/nanoGPT', desc: 'Simplest fastest repository for training/finetuning GPT', stars: '38k+', url: 'https://github.com/karpathy/nanoGPT', cat: 'llm' },
  { name: 'karpathy/minGPT', desc: 'Minimal PyTorch re-implementation of the GPT training', stars: '21k+', url: 'https://github.com/karpathy/minGPT', cat: 'llm' },
  { name: 'karpathy/llm.c', desc: 'LLM training in simple C/CUDA with no dependencies', stars: '30k+', url: 'https://github.com/karpathy/llm.c', cat: 'llm', rising: true },
  { name: 'EleutherAI/gpt-neox', desc: 'GPT-NeoX: large-scale autoregressive language modeling', stars: '7k+', url: 'https://github.com/EleutherAI/gpt-neox', cat: 'llm' },
  { name: 'togethercomputer/RedPajama-Data', desc: 'RedPajama: open dataset for training large LLMs', stars: '4k+', url: 'https://github.com/togethercomputer/RedPajama-Data', cat: 'llm' },
  { name: 'Lightning-AI/lit-llama', desc: 'Implementation of LLaMA based on nanoGPT', stars: '5k+', url: 'https://github.com/Lightning-AI/lit-llama', cat: 'llm' },
  { name: 'microsoft/DeepSpeed', desc: 'Deep learning optimization for training and inference', stars: '36k+', url: 'https://github.com/microsoft/DeepSpeed', cat: 'llm' },
  { name: 'facebookresearch/metaseq', desc: 'Codebase for large language model training at Meta', stars: '7k+', url: 'https://github.com/facebookresearch/metaseq', cat: 'llm' },
  { name: 'explosion/spaCy', desc: 'Industrial-strength NLP with transformer support', stars: '30k+', url: 'https://github.com/explosion/spaCy', cat: 'llm' },
  { name: 'abetlen/llama-cpp-python', desc: 'Python bindings for llama.cpp with OpenAI-compatible API', stars: '9k+', url: 'https://github.com/abetlen/llama-cpp-python', cat: 'llm' },
  { name: 'simonw/llm', desc: 'Access large language models from the command line', stars: '5k+', url: 'https://github.com/simonw/llm', cat: 'tools' },
  { name: 'SevaSk/ecoute', desc: 'Live transcription and GPT-powered response suggestions', stars: '6k+', url: 'https://github.com/SevaSk/ecoute', cat: 'tools' },
  { name: 'PromtEngineer/localGPT', desc: 'Chat with documents locally using GPU acceleration', stars: '20k+', url: 'https://github.com/PromtEngineer/localGPT', cat: 'rag' },
  { name: 'mayooear/gpt4-pdf-chatbot-langchain', desc: 'GPT-4 PDF chatbot using LangChain and Pinecone', stars: '14k+', url: 'https://github.com/mayooear/gpt4-pdf-chatbot-langchain', cat: 'rag' },
  { name: 'homanp/superagent', desc: 'Open-source AI agent deployment platform', stars: '5k+', url: 'https://github.com/homanp/superagent', cat: 'agent' },
  { name: 'josStorer/chatGPTBox', desc: 'Deeply integrate ChatGPT into your browser', stars: '10k+', url: 'https://github.com/josStorer/chatGPTBox', cat: 'tools' },
  { name: 'tensorchord/pgvecto.rs', desc: 'Scalable, low-latency vector search in Postgres via Rust', stars: '2k+', url: 'https://github.com/tensorchord/pgvecto.rs', cat: 'rag' },
  { name: 'microsoft/torchscale', desc: 'Foundation architecture research by Microsoft', stars: '3k+', url: 'https://github.com/microsoft/torchscale', cat: 'llm' },
  { name: 'openai/human-eval', desc: 'HumanEval: hand-crafted code generation evaluation', stars: '4k+', url: 'https://github.com/openai/human-eval', cat: 'tools' },
  { name: 'lupantech/chameleon-llm', desc: 'Plug-and-play compositional reasoning with LLMs', stars: '1k+', url: 'https://github.com/lupantech/chameleon-llm', cat: 'agent' },
  { name: 'RayVentura/ShortGPT', desc: 'Automated short-content video creation with AI', stars: '5k+', url: 'https://github.com/RayVentura/ShortGPT', cat: 'tools' },
  { name: 'embedchain/embedchain', desc: 'Open-source RAG framework for creating chatbots', stars: '9k+', url: 'https://github.com/embedchain/embedchain', cat: 'rag' },
  { name: 'babyagi-official/babyagi', desc: 'AI-powered task management and autonomous agent', stars: '20k+', url: 'https://github.com/yoheinakajima/babyagi', cat: 'agent' },
];

let trendingAllRepos = [];   // full fetched/curated list (GitHub Trending tab)
let trendingCount = 10;      // current display count
let trendingView = 'trending'; // active tab: trending | stars | rising | category

// ─── Trending helpers ─────────────────────────────────
function parseStars(s) {
  const str = String(s || '0');
  const n = parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
  return str.toLowerCase().includes('k') ? n * 1000 : n;
}

function sortedByStars() {
  return [...CURATED_TRENDING].sort((a, b) => parseStars(b.stars) - parseStars(a.stars));
}

function risingRepos() {
  return CURATED_TRENDING.filter(r => r.rising);
}

const TRENDING_CAT_META = {
  llm:      { label: 'LLMs & Models',    icon: '🧠' },
  agent:    { label: 'Agent Frameworks', icon: '🤖' },
  rag:      { label: 'RAG & Memory',     icon: '🔍' },
  tools:    { label: 'Tools & Infra',    icon: '⚙️'  },
  'sap-ai': { label: 'SAP AI',           icon: '🏢' },
};

function trendingItemHtml(r, i) {
  return `
    <a class="trending-item" href="${r.url || r.html_url || '#'}" target="_blank" rel="noopener noreferrer">
      <span class="trending-rank">${String(i + 1).padStart(2, '0')}</span>
      <div class="trending-info">
        <div class="trending-title">${escHtml(r.name || r.full_name)}</div>
        <div class="trending-desc">${escHtml(r.desc || r.description || '')}</div>
      </div>
      <span class="trending-stars">⭐ ${r.stars || r.stargazers_count || '—'}</span>
    </a>`;
}

function renderTrendingByCategory() {
  const trendEl = document.getElementById('trending-list');

  const firstKey = Object.keys(TRENDING_CAT_META)[0];
  const options = Object.entries(TRENDING_CAT_META)
    .map(([key, meta]) => {
      const count = CURATED_TRENDING.filter(r => r.cat === key).length;
      return `<option value="${key}">${meta.icon} ${meta.label} (${count})</option>`;
    }).join('');

  trendEl.innerHTML = `
    <div class="cat-select-bar">
      <label for="cat-select" class="select-label">Category</label>
      <div class="select-wrap" style="flex:1;max-width:320px;">
        <select id="cat-select" class="styled-select" style="width:100%">${options}</select>
      </div>
    </div>
    <div id="cat-repos-list"></div>`;

  function showCat(key) {
    const repos = CURATED_TRENDING.filter(r => r.cat === key);
    const list = document.getElementById('cat-repos-list');
    if (!repos.length) {
      list.innerHTML = `<p style="font-size:13px;color:var(--text-muted);padding:16px 0;">Coming soon — resources being added.</p>`;
    } else {
      list.innerHTML = `<div class="trending-cat-list">${repos.map((r, i) => trendingItemHtml(r, i)).join('')}</div>`;
    }
  }

  showCat(firstKey);
  trendEl.querySelector('#cat-select').addEventListener('change', e => showCat(e.target.value));
}

function renderTrending(repos, isLive) {
  trendingAllRepos = repos;
  const liveEl = document.getElementById('trending-status');

  if (isLive) {
    liveEl.innerHTML = `<span class="live-indicator"><span class="live-dot"></span> Live</span>`;
    const dot = document.getElementById('tab-live-dot');
    if (dot) dot.classList.add('visible');
  } else {
    liveEl.innerHTML = `<span style="font-size:12px;color:var(--text-muted)">Curated</span>`;
  }

  renderTrendingList();
}

function renderTrendingList() {
  if (trendingView === 'category') { renderTrendingByCategory(); return; }

  const pool = trendingView === 'stars'  ? sortedByStars()
             : trendingView === 'rising' ? risingRepos()
             : trendingAllRepos;

  const trendEl = document.getElementById('trending-list');
  const count = Math.min(trendingCount, pool.length);
  if (!pool.length) {
    trendEl.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted)">No repos to show.</div>`;
    return;
  }
  trendEl.innerHTML = pool.slice(0, count).map((r, i) => trendingItemHtml(r, i)).join('');
}

async function loadTrending() {
  // Try a CORS-friendly public trending endpoint
  try {
    const cached = sessionStorage.getItem(TRENDING_CACHE_KEY);
    if (cached) {
      renderTrending(JSON.parse(cached), true);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://ghtrending.vercel.app/repositories', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const repos = (data.items || data || []).slice(0, 8).map(r => ({
        name: r.author ? `${r.author}/${r.name}` : r.name,
        desc: r.description || '',
        stars: r.stars || r.stargazers_count || '—',
        url: r.url || `https://github.com/${r.author}/${r.name}`
      }));
      if (repos.length > 0) {
        sessionStorage.setItem(TRENDING_CACHE_KEY, JSON.stringify(repos));
        renderTrending(repos, true);
        return;
      }
    }
  } catch (_) {}

  renderTrending(CURATED_TRENDING, false);
}

// ─── Search & Filter ──────────────────────────────────
let allItems = [];
let filteredItems = [];
let activeCategory = 'all';
let searchQuery = '';

function applyFilters() {
  const q = searchQuery.toLowerCase();
  filteredItems = allItems.filter(item => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.tags || []).some(t => t.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });
  renderAllCards();
}

function renderAllCards() {
  const grid = document.getElementById('all-cards-grid');
  const state = loadState();

  if (filteredItems.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🔍</div>
      <h3>No matches found</h3>
      <p>Try a different search term or category filter.</p>
    </div>`;
    return;
  }

  grid.innerHTML = filteredItems.map(item => renderCard(item, state)).join('');
  bindLearnedButtons(grid);
}

// ─── Learned toggle ───────────────────────────────────
function bindLearnedButtons(container) {
  container.querySelectorAll('.learned-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const state = loadState();
      const learned = state.learned || [];
      const idx = learned.indexOf(id);
      if (idx === -1) {
        state.learned = [...learned, id];
        btn.classList.add('active');
        btn.textContent = '✅';
        btn.closest('.card').classList.add('learned');
        showToast('Marked as learned! Keep going 🎉');
      } else {
        state.learned = learned.filter(i => i !== id);
        btn.classList.remove('active');
        btn.textContent = '○';
        btn.closest('.card').classList.remove('learned');
      }
      saveState(state);
      updateProgressUI(state);
    });
  });
}

// ─── Progress UI ──────────────────────────────────────
function updateProgressUI(state) {
  const learned = (state.learned || []).length;
  const total = allItems.length;
  const pct = total ? Math.round((learned / total) * 100) : 0;

  const el = (id) => document.getElementById(id);
  if (el('stat-streak')) el('stat-streak').textContent = state.streak || 1;
  if (el('stat-learned')) el('stat-learned').textContent = learned;
  if (el('stat-total')) el('stat-total').textContent = total;
  if (el('stat-days')) el('stat-days').textContent = (state.visitHistory || []).length;
  if (el('progress-fill')) {
    el('progress-fill').style.width = pct + '%';
  }
  if (el('progress-pct')) el('progress-pct').textContent = pct + '%';
  if (el('streak-count')) el('streak-count').textContent = state.streak || 1;
}

// ─── Toast ────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.querySelector('.toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── Share ────────────────────────────────────────────
function shareApp() {
  const url = window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showToast('🔗 Link copied to clipboard!'));
  } else {
    const el = document.createElement('textarea');
    el.value = url;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('🔗 Link copied to clipboard!');
  }
}

// ─── Date display ─────────────────────────────────────
function formatDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── Main init ────────────────────────────────────────
async function init() {
  const today = new Date();
  document.getElementById('hero-date').textContent = formatDate(today);
  document.getElementById('header-date').textContent = getTodayString();

  // Streak
  let state = loadState();
  state = updateStreak(state);
  saveState(state);
  updateProgressUI(state);

  // Clear trending cache if it's from a previous day
  const cachedDay = sessionStorage.getItem('ai-trending-date');
  if (cachedDay !== getTodayString()) {
    sessionStorage.removeItem(TRENDING_CACHE_KEY);
    sessionStorage.setItem('ai-trending-date', getTodayString());
  }

  // Load content — cache-bust with daily version so browser always fetches today's file
  let items = [];
  try {
    const res = await fetch(`./data/content.json?v=${getDailySeed()}`, { cache: 'no-cache' });
    items = await res.json();
  } catch (e) {
    document.getElementById('daily-grid').innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">⚠️</div><h3>Could not load content</h3><p>Please refresh or try again.</p></div>';
    return;
  }

  allItems = items;
  filteredItems = items;

  // Daily picks
  const { featured, bonus } = selectDailyContent(items);

  const dailyGrid = document.getElementById('daily-grid');
  dailyGrid.innerHTML = featured.map(item => renderCard(item, state, { featured: true })).join('');
  bindLearnedButtons(dailyGrid);

  const bonusGrid = document.getElementById('bonus-grid');
  bonusGrid.innerHTML = bonus.map(item => renderCard(item, state)).join('');
  bindLearnedButtons(bonusGrid);

  // All cards
  renderAllCards();

  // Trending
  loadTrending();

  // Filters
  document.querySelectorAll('.pill[data-cat]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill[data-cat]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.dataset.cat;
      applyFilters();
    });
  });

  // Search
  let debounce;
  document.getElementById('search-input').addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      searchQuery = e.target.value;
      applyFilters();
    }, 280);
  });

  // ── Scroll-spy with IntersectionObserver ──────────────
  const sections = document.querySelectorAll('.page-section');
  const tabs = document.querySelectorAll('.tab[data-section]');

  function setActiveTab(sectionId) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.section === sectionId));
  }

  // Track which sections are currently visible; activate the topmost one
  const visible = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) visible.add(e.target.id);
      else visible.delete(e.target.id);
    });
    // Pick the section that appears first in DOM order among visible ones
    for (const s of sections) {
      if (visible.has(s.id)) { setActiveTab(s.id); break; }
    }
  }, {
    rootMargin: '-112px 0px -40% 0px',  // offset matches scroll-margin-top
    threshold: 0
  });
  sections.forEach(s => observer.observe(s));

  // ── Click-to-jump: smooth scroll to section ───────────
  tabs.forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(tab.dataset.section);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Trending view tabs
  document.querySelectorAll('.trending-tab[data-tview]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.trending-tab[data-tview]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      trendingView = tab.dataset.tview;
      const cw = document.getElementById('count-wrap');
      if (cw) cw.style.display = trendingView === 'category' ? 'none' : 'flex';
      renderTrendingList();
    });
  });

  // Trending count dropdown
  document.getElementById('trending-count').addEventListener('change', e => {
    trendingCount = parseInt(e.target.value, 10);
    renderTrendingList();
  });

  // Refresh button — clears all caches and hard-reloads
  document.getElementById('refresh-btn').addEventListener('click', () => {
    sessionStorage.removeItem(TRENDING_CACHE_KEY);
    sessionStorage.removeItem('ai-trending-date');
    showToast('↻ Refreshing content…');
    setTimeout(() => location.reload(true), 600);
  });

  // Share button
  document.getElementById('share-btn').addEventListener('click', shareApp);

  // Update stats after load
  updateProgressUI(state);
}

document.addEventListener('DOMContentLoaded', init);
