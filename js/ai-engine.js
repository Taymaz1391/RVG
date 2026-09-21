/**
 * TOM AI - Multi-Provider Inference Router & Streaming Engine
 * Seamlessly interfaces between:
 * 1. Free Cloud Streaming LLMs (Pollinations AI / Puter - zero API key required)
 * 2. BYO Custom API Key (OpenAI, Groq, OpenRouter, Anthropic, Ollama)
 * 3. Built-in Local Offline Neural Core (Pure client-side transformer brain)
 */

class AIEngine {
  constructor() {
    this.neuralCore = new TomNeuralCore();
    this.abortController = null;
  }

  // Model ID to Cloud Model mapping
  mapModelToCloud(modelId) {
    switch (modelId) {
      case 'tom-4.5-ultra':
        return 'openai'; // GPT-4o on Pollinations
      case 'tom-o1-reasoning':
        return 'deepseek'; // DeepSeek R1 / Reasoning
      case 'tom-speed-mini':
        return 'openai'; // Fast gpt-4o-mini
      case 'tom-code-pro':
        return 'qwen-coder'; // Coding specialist
      default:
        return 'openai';
    }
  }

  // Abort any ongoing stream
  abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // Generate Response Stream
  async *chatStream({ messages, model, systemPrompt, temperature, searchMode, onThought }) {
    this.abort();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const settings = StorageManager.getSettings();
    const currentModel = model || settings.model;

    // 1. Generate Chain-of-Thought (CoT) if reasoning model
    if (onThought && (currentModel.includes('reasoning') || currentModel.includes('ultra') || currentModel.includes('o1'))) {
      const lastUserMsg = messages[messages.length - 1]?.content || '';
      const thoughtSteps = this.neuralCore.generateThoughtSteps(lastUserMsg, currentModel);
      if (thoughtSteps) {
        onThought(thoughtSteps);
      }
    }

    // 2. Decide Provider Execution Route
    if (settings.provider === 'local-neural' || currentModel === 'tom-neural-local') {
      // Direct Local Offline Neural Core
      const lastUserMsg = messages[messages.length - 1]?.content || '';
      for await (const chunk of this.neuralCore.generateStream(lastUserMsg, messages, currentModel, searchMode)) {
        if (signal.aborted) break;
        yield chunk;
      }
      return;
    }

    if (settings.provider.startsWith('custom-') && settings.apiKey) {
      // Custom API Endpoint
      try {
        for await (const chunk of this.streamCustomAPI(messages, settings, currentModel, systemPrompt, signal)) {
          yield chunk;
        }
        return;
      } catch (err) {
        console.warn('Custom API failed, falling back to Free Cloud / Local Core:', err);
      }
    }

    // Default: High-Speed Free Streaming Cloud LLM (Pollinations AI)
    try {
      for await (const chunk of this.streamPollinations(messages, currentModel, systemPrompt, searchMode, signal)) {
        yield chunk;
      }
    } catch (err) {
      console.warn('Cloud API stream error, falling back to Local Neural Core:', err);
      // Seamless Offline Fallback
      const lastUserMsg = messages[messages.length - 1]?.content || '';
      for await (const chunk of this.neuralCore.generateStream(lastUserMsg, messages, currentModel, searchMode)) {
        if (signal.aborted) break;
        yield chunk;
      }
    }
  }

  // Stream from Pollinations Free OpenAI-Compatible Engine
  async *streamPollinations(messages, model, systemPrompt, searchMode, signal) {
    const cloudModel = this.mapModelToCloud(model);
    
    // Inject enhanced system prompt and grounding
    let enhancedSystem = systemPrompt || 'You are TOM, a state-of-the-art AI built from scratch to rival and surpass ChatGPT-4o.';
    if (searchMode) {
      enhancedSystem += ' [Grounding Mode Active: Cross-reference latest 2026 data and verified technical documentation.]';
    }

    const payloadMessages = [
      { role: 'system', content: enhancedSystem },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: payloadMessages,
        model: cloudModel,
        stream: true,
        seed: Math.floor(Math.random() * 100000)
      }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Pollinations HTTP Error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (signal.aborted) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Handle raw streaming text or SSE data lines
      if (buffer.includes('data:')) {
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep last unfinished piece

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const token = parsed.choices?.[0]?.delta?.content || parsed.text || '';
              if (token) yield token;
            } catch (e) {
              // Plain text line fallback
              yield trimmed.slice(6);
            }
          }
        }
      } else {
        // Direct text stream
        yield chunk;
      }
    }

    if (buffer && !buffer.startsWith('data:')) {
      yield buffer;
    }
  }

  // Stream from Custom User-Configured API (OpenAI / Groq / OpenRouter)
  async *streamCustomAPI(messages, settings, model, systemPrompt, signal) {
    let endpoint = settings.apiEndpoint;
    let authHeader = `Bearer ${settings.apiKey}`;
    let modelName = 'gpt-4o';

    if (settings.provider === 'custom-openai') {
      endpoint = endpoint || 'https://api.openai.com/v1/chat/completions';
      modelName = model === 'tom-o1-reasoning' ? 'o1-mini' : 'gpt-4o';
    } else if (settings.provider === 'custom-groq') {
      endpoint = endpoint || 'https://api.groq.com/openai/v1/chat/completions';
      modelName = 'llama-3.3-70b-versatile';
    } else if (settings.provider === 'custom-openrouter') {
      endpoint = endpoint || 'https://openrouter.ai/api/v1/chat/completions';
      modelName = 'openai/gpt-4o';
    }

    const payload = {
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      stream: true,
      temperature: settings.temperature || 0.7
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload),
      signal
    });

    if (!response.ok) {
      throw new Error(`Custom API returned status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (signal.aborted) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const token = parsed.choices?.[0]?.delta?.content || '';
            if (token) yield token;
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }
}

window.AIEngine = AIEngine;
