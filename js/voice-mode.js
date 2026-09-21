/**
 * TOM AI - ChatGPT Voice Mode (Interactive Fluid Glowing Orb & Hands-Free Audio)
 */

class VoiceModeManager {
  constructor() {
    this.isActive = false;
    this.isMuted = false;
    this.state = 'idle'; // 'idle', 'listening', 'thinking', 'speaking'
    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.phase = 0;
    this.speech = null;
    this.init();
  }

  init() {
    this.modal = document.getElementById('voiceCallModal');
    this.canvas = document.getElementById('voiceOrbCanvas');
    this.captionBox = document.getElementById('voiceCaptionText');
    this.statusText = document.getElementById('voiceStatusLabel');
    this.btnMute = document.getElementById('btnVoiceMute');
    this.btnEnd = document.getElementById('btnVoiceEnd');

    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.canvas.width = 320;
      this.canvas.height = 320;
    }

    this.btnMute?.addEventListener('click', () => this.toggleMute());
    this.btnEnd?.addEventListener('click', () => this.close());
    document.getElementById('btnCloseVoiceModal')?.addEventListener('click', () => this.close());
    document.getElementById('btnHeaderVoiceMode')?.addEventListener('click', () => this.open());
  }

  open() {
    this.isActive = true;
    this.speech = window.app?.speech;
    this.modal?.classList.add('active');
    this.startAnimation();
    this.setState('listening');
    this.setCaption('Listening to your voice... Speak anytime.');
    this.startListeningLoop();
  }

  close() {
    this.isActive = false;
    this.modal?.classList.remove('active');
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.speech) {
      this.speech.stop();
      this.speech.stopListening();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.btnMute?.classList.toggle('muted', this.isMuted);
    if (this.isMuted) {
      this.speech?.stopListening();
      this.setCaption('Microphone is muted.');
    } else {
      this.setCaption('Microphone unmuted. Listening...');
      this.startListeningLoop();
    }
  }

  setState(state) {
    this.state = state;
    if (this.statusText) {
      const labels = {
        idle: 'TOM Voice • Standby',
        listening: 'TOM is listening...',
        thinking: 'TOM is thinking...',
        speaking: 'TOM is speaking...'
      };
      this.statusText.textContent = labels[state] || 'TOM Voice';
    }
  }

  setCaption(text) {
    if (this.captionBox) {
      this.captionBox.textContent = text;
    }
  }

  startListeningLoop() {
    if (!this.isActive || this.isMuted) return;

    this.setState('listening');
    this.speech?.startListening(
      (transcript) => {
        if (!this.isActive) return;
        this.setCaption(`You: "${transcript}"`);
        this.processVoiceQuery(transcript);
      },
      (err) => {
        if (!this.isActive || this.isMuted) return;
        // Keep listening loop active
        setTimeout(() => this.startListeningLoop(), 600);
      }
    );
  }

  async processVoiceQuery(userText) {
    if (!userText.trim()) {
      this.startListeningLoop();
      return;
    }

    this.setState('thinking');
    this.setCaption(`Thinking about: "${userText}"...`);

    // Query TOM Engine
    try {
      const chat = window.app.getCurrentChat();
      const messages = chat ? [...chat.messages, { role: 'user', content: userText }] : [{ role: 'user', content: userText }];

      let reply = '';
      const stream = window.app.aiEngine.chatStream({
        messages,
        model: 'tom-4.5-ultra',
        systemPrompt: 'You are TOM speaking in ChatGPT Voice Mode. Keep your responses concise, conversational, and direct for spoken audio.',
        temperature: 0.7
      });

      for await (const chunk of stream) {
        reply += chunk;
      }

      this.setState('speaking');
      this.setCaption(`TOM: "${reply.slice(0, 160)}${reply.length > 160 ? '...' : ''}"`);

      // Synthesize Speech
      this.speech?.speak(reply, () => {
        if (this.isActive && !this.isMuted) {
          this.setCaption('Listening to your voice... Speak anytime.');
          this.startListeningLoop();
        }
      });

    } catch (e) {
      console.error('Voice processing error', e);
      this.startListeningLoop();
    }
  }

  // Animated Fluid Orb Canvas Loop
  startAnimation() {
    const render = () => {
      if (!this.isActive) return;
      this.phase += 0.04;
      this.drawOrb();
      this.animId = requestAnimationFrame(render);
    };
    render();
  }

  drawOrb() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const baseRadius = 85;

    ctx.clearRect(0, 0, w, h);

    // Color palette based on state
    let coreColor1, coreColor2, glowColor;
    if (this.state === 'speaking') {
      coreColor1 = '#10b981';
      coreColor2 = '#06b6d4';
      glowColor = 'rgba(16, 185, 129, 0.4)';
    } else if (this.state === 'thinking') {
      coreColor1 = '#8b5cf6';
      coreColor2 = '#ec4899';
      glowColor = 'rgba(139, 92, 246, 0.4)';
    } else { // listening or idle
      coreColor1 = '#06b6d4';
      coreColor2 = '#3b82f6';
      glowColor = 'rgba(6, 182, 212, 0.35)';
    }

    // Outer Harmonic Rings
    for (let r = 0; r < 3; r++) {
      ctx.beginPath();
      const ringRad = baseRadius + 20 + r * 16 + Math.sin(this.phase + r) * 6;
      ctx.arc(cx, cy, ringRad, 0, Math.PI * 2);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Deforming fluid core
    ctx.save();
    ctx.translate(cx, cy);

    ctx.beginPath();
    const points = 36;
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const wave = Math.sin(angle * 4 + this.phase * 2) * 8 + Math.cos(angle * 2 - this.phase) * 5;
      const radius = baseRadius + wave;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, baseRadius + 15);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, coreColor1);
    grad.addColorStop(0.8, coreColor2);
    grad.addColorStop(1, 'rgba(0,0,0,0.2)');

    ctx.fillStyle = grad;
    ctx.shadowColor = coreColor1;
    ctx.shadowBlur = 35;
    ctx.fill();
    ctx.restore();
  }
}

window.VoiceModeManager = VoiceModeManager;
