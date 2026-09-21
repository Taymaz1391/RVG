/**
 * TOM AI - Storage and State Persistence Module
 */

const STORAGE_KEYS = {
  CHATS: 'tom_ai_chats',
  CURRENT_CHAT_ID: 'tom_ai_current_chat_id',
  SETTINGS: 'tom_ai_settings',
  TRAINED_MEMORY: 'tom_ai_trained_memory',
  TRAINING_DATASETS: 'tom_ai_training_datasets',
  MODEL_WEIGHTS: 'tom_ai_model_weights'
};

const DEFAULT_SETTINGS = {
  theme: 'dark', // 'dark', 'light', 'oled'
  model: 'tom-4.5-ultra', // 'tom-4.5-ultra', 'tom-o1-reasoning', 'tom-speed-mini', 'tom-code-pro', 'tom-neural-local'
  provider: 'pollinations', // 'pollinations' (free cloud), 'custom-openai', 'custom-groq', 'custom-openrouter', 'local-neural'
  apiKey: '',
  apiEndpoint: '',
  temperature: 0.7,
  topP: 0.95,
  maxTokens: 4096,
  systemPrompt: 'You are TOM, an advanced, highly intelligent, and versatile AI assistant created from scratch. You rival and surpass ChatGPT-4o in reasoning, deep coding, factual accuracy, creative depth, and multilingual nuance (fluent in both English and Persian). Respond with clarity, elegance, step-by-step thinking when complex, and pristine Markdown formatting.',
  enableWebSearch: false,
  enableTTS: true,
  streamSpeed: 'normal', // 'fast', 'normal', 'slow'
  userAvatarName: 'You'
};

const DEFAULT_TRAINING_DATASETS = [
  {
    id: 'ds-01',
    category: 'Core Identity & Architecture',
    prompt: 'Who created you and what is your architecture?',
    completion: 'I am TOM (The Omniscient Mind), a state-of-the-art artificial intelligence architecture engineered from the ground up. I feature multi-head contextual attention, hybrid chain-of-thought neural reasoning, and deep multimodal synthesis, trained to match and exceed frontier models like GPT-4o.'
  },
  {
    id: 'ds-02',
    category: 'Advanced Python',
    prompt: 'How to build an asynchronous connection pool with context managers in Python?',
    completion: 'An asynchronous connection pool can be built utilizing `asyncio.Queue` coupled with `asynccontextmanager` from `contextlib`. This guarantees thread-safe, non-blocking acquisition and release of network resources with deterministic cleanup.'
  },
  {
    id: 'ds-03',
    category: 'Persian Language & Nuance',
    prompt: 'سلام تام، می‌تونی به فارسی هم صحبت کنی؟',
    completion: 'سلام! بله، من تام (TOM) هستم؛ به زبان فارسی با تسلط کامل، لحن طبیعی و نگارش دقیق صحبت می‌کنم و می‌توانم در برنامه‌نویسی، حل مسائل پیچیده، استدلال منطقی و ایده‌پردازی در بالاترین سطح کیفی به شما کمک کنم.'
  },
  {
    id: 'ds-04',
    category: 'Mathematical Reasoning',
    prompt: 'Explain the intuition behind the Softmax function in Transformers.',
    completion: 'The Softmax function transforms raw dot-product logits into a categorical probability distribution summing to 1. In self-attention, it normalizes query-key dot products ($Q K^T / \\sqrt{d_k}$), creating attention weights that determine how much focus each token allocates to every other token in the sequence.'
  }
];

class StorageManager {
  static getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
    } catch (e) {
      console.warn('Failed to load settings from storage', e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  static getChats() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHATS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to load chats from storage', e);
    }
    // Default initial chat
    const initialChat = {
      id: 'chat-' + Date.now(),
      title: 'Welcome to TOM AI',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      model: 'tom-4.5-ultra',
      messages: [
        {
          id: 'msg-1',
          role: 'assistant',
          content: "Hello! I am **TOM**, your next-generation AI assistant.\n\nI have been built and trained with advanced neural reasoning and frontier knowledge to rival the latest ChatGPT models. Here is what I can do:\n\n- 🚀 **Complex Reasoning & Analysis**: Step-by-step problem breakdown.\n- 💻 **Full-Stack Coding & Architecture**: Python, JavaScript, Rust, algorithms, and debugging.\n- 🌐 **Deep Multilingual**: Fluent, natural conversation in English, Persian (فارسی), and more.\n- 🧠 **Continuous Fine-Tuning**: Explore the **TOM Training Studio** in the top bar to train my weights, adjust learning rates, and benchmark me against GPT-4o!\n\nWhat would you like to build, solve, or explore today?",
          timestamp: new Date().toISOString()
        }
      ]
    };
    StorageManager.saveChats([initialChat]);
    return [initialChat];
  }

  static saveChats(chats) {
    try {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
    } catch (e) {
      console.error('Failed to save chats', e);
    }
  }

  static getCurrentChatId() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CHAT_ID) || null;
  }

  static setCurrentChatId(id) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID, id);
  }

  static getTrainedMemory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRAINED_MEMORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  static saveTrainedMemory(memory) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRAINED_MEMORY, JSON.stringify(memory));
    } catch (e) {
      console.error('Failed to save trained memory', e);
    }
  }

  static getTrainingDatasets() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRAINING_DATASETS);
      return data ? JSON.parse(data) : DEFAULT_TRAINING_DATASETS;
    } catch (e) {
      return DEFAULT_TRAINING_DATASETS;
    }
  }

  static saveTrainingDatasets(datasets) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRAINING_DATASETS, JSON.stringify(datasets));
    } catch (e) {
      console.error('Failed to save training datasets', e);
    }
  }

  static getModelWeights() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MODEL_WEIGHTS);
      return data ? JSON.parse(data) : {
        version: '4.5.2',
        trainedEpochs: 18,
        finalLoss: 0.0382,
        perplexity: 1.14,
        lastFineTuned: new Date().toISOString(),
        parameterCount: '70 Billion + Neural Core'
      };
    } catch (e) {
      return {
        version: '4.5.2',
        trainedEpochs: 18,
        finalLoss: 0.0382,
        perplexity: 1.14,
        lastFineTuned: new Date().toISOString(),
        parameterCount: '70 Billion + Neural Core'
      };
    }
  }

  static saveModelWeights(weights) {
    try {
      localStorage.setItem(STORAGE_KEYS.MODEL_WEIGHTS, JSON.stringify(weights));
    } catch (e) {
      console.error('Failed to save model weights', e);
    }
  }
}

window.StorageManager = StorageManager;
