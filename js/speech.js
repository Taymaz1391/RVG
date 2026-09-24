/**
 * TOM AI - Speech Engine (Text-to-Speech & Speech-to-Text)
 */

class SpeechEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.recognition = null;
    this.isSpeaking = false;
    this.isListening = false;
    this.currentUtterance = null;
    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  speak(text, onEnd) {
    if (!this.synth) return;
    this.stop();

    // Clean markdown before speaking
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code snippet omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[#*_\-\>]/g, '')
      .trim();

    if (!cleanText) return;

    this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
    
    // Choose natural voice
    const voices = this.synth.getVoices();
    const naturalVoice = voices.find(v => v.name.includes('Natural') || v.name.includes('Google') || v.lang.startsWith('en')) || voices[0];
    if (naturalVoice) {
      this.currentUtterance.voice = naturalVoice;
    }

    this.currentUtterance.rate = 1.05;
    this.currentUtterance.pitch = 1.0;

    this.currentUtterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.currentUtterance.onerror = (e) => {
      console.warn('Speech synthesis error', e);
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.isSpeaking = true;
    this.synth.speak(this.currentUtterance);
  }

  stop() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
  }

  startListening(onResult, onError) {
    if (!this.recognition) {
      if (onError) onError('Speech recognition is not supported in this browser.');
      return;
    }

    this.isListening = true;

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.isListening = false;
      if (onResult) onResult(transcript);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (onError) onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
    } catch (e) {
      this.isListening = false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

window.SpeechEngine = SpeechEngine;
