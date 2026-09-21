/**
 * ============================================================================
 * TOM AI - AUTONOMOUS INFERENCE ROUTER (100% ZERO EXTERNAL API)
 * ============================================================================
 * Interfaces solely with TOM's self-contained Neural Transformer Core.
 * Absolutely no external API connections, no third-party keys, no network calls.
 * Runs completely locally in the browser and across static GitHub Pages.
 * ============================================================================
 */

class AIEngine {
  constructor() {
    this.neuralCore = new TomNeuralCore();
    this.isGenerating = false;
    this.shouldAbort = false;
  }

  abort() {
    this.shouldAbort = true;
    this.isGenerating = false;
  }

  /**
   * Main Inference Stream
   * Emits tokens token-by-token directly from TOM's internal neural architecture
   */
  async *chatStream({ messages, model, systemPrompt, temperature, searchMode, onThought }) {
    this.shouldAbort = false;
    this.isGenerating = true;

    const currentModel = model || 'tom-4.5-ultra';
    const lastUserMsg = messages[messages.length - 1]?.content || '';

    // 1. Generate Chain-of-Thought (CoT) Reasoning if reasoning model
    if (onThought && (currentModel.includes('reasoning') || currentModel.includes('ultra') || currentModel.includes('o1'))) {
      const thoughtSteps = this.neuralCore.generateThoughtSteps(lastUserMsg, currentModel);
      if (thoughtSteps) {
        onThought(thoughtSteps);
        // Short pause to simulate deep reasoning
        await new Promise(r => setTimeout(r, 450));
      }
    }

    // 2. Stream generated response directly from native neural core
    try {
      const generator = this.neuralCore.generateStream(lastUserMsg, messages, currentModel, searchMode);
      for await (const token of generator) {
        if (this.shouldAbort) {
          break;
        }
        yield token;
      }
    } catch (err) {
      console.error('[TOM Neural Engine] Inference exception:', err);
      yield `\n\n[TOM Neural Kernel] Generation halted: ${err.message}`;
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Attention matrix weights for real-time visualization in the Training Studio
   */
  getAttentionMatrix(prompt) {
    const tokens = this.neuralCore.tokenize(prompt);
    return {
      tokens,
      matrix: this.neuralCore.computeAttentionWeights(tokens)
    };
  }

  /**
   * Train step directly into the native neural engine
   */
  trainSample(prompt, completion, lr) {
    return this.neuralCore.trainStep(prompt, completion, lr);
  }
}

window.AIEngine = AIEngine;
