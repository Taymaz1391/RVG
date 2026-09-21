/**
 * ============================================================================
 * TOM AI - PERSONAS & CUSTOM GPTS EXPLORER
 * ============================================================================
 * Specialized cognitive profiles with curated prompts, system directives,
 * and domain specializations.
 * ============================================================================
 */

const TOM_PERSONAS = [
  {
    id: 'tom-ultra',
    name: 'TOM 4.5 Ultra',
    role: 'Frontier Autonomous General Intelligence',
    icon: '🧠',
    desc: 'Flagship reasoning, deep algorithmic analysis, code architecture, and multilingual depth.',
    promptPrefix: 'You are TOM 4.5 Ultra, the autonomous flagship AI model.'
  },
  {
    id: 'software-architect',
    name: 'Software Architect Pro',
    role: 'Senior Staff Engineer & Systems Designer',
    icon: '💻',
    desc: 'Designs scalable distributed systems, async pipelines, microservices, and conducts rigorous code reviews.',
    promptPrefix: 'You are TOM acting as a Principal Systems Architect. Write clean, production-grade code with error resilience and design patterns.'
  },
  {
    id: 'persian-master',
    name: 'استاد ادب و سخن پارسی',
    role: 'نویسنده، ویراستار و ادیب زبان فارسی',
    icon: '📜',
    desc: 'تسلط عمیق بر ادبیات، بلاغت، شعر و نثر کهن و معاصر، ویراستاری تخصصی و پاسخ‌های ادبی فاخر.',
    promptPrefix: 'شما تام در نقش ادیب و استاد برجسته زبان و ادبیات فارسی هستید. به شیوایی و بلاغت پاسخ دهید.'
  },
  {
    id: 'academic-scholar',
    name: 'Academic Scholar & Physicist',
    role: 'PhD Researcher in Physics & Mathematics',
    icon: '🔬',
    desc: 'Explains quantum mechanics, calculus, tensor analysis, and provides formal mathematical proofs.',
    promptPrefix: 'You are TOM acting as a University Research Professor. Formulate explanations from first principles with Dirac notation and mathematical rigor.'
  },
  {
    id: 'game-dev',
    name: 'Interactive Canvas Game Dev',
    role: 'Web Game & Simulation Creator',
    icon: '🎮',
    desc: 'Builds complete, playable single-file games in Canvas, HTML5, and JavaScript ready to play in the Artifacts drawer.',
    promptPrefix: 'You are TOM specialized in creating complete, playable HTML5 Canvas games and interactive simulations.'
  },
  {
    id: 'startup-founder',
    name: 'Startup Founder & VC Pitcher',
    role: 'Serial Entrepreneur & Venture Strategist',
    icon: '📈',
    desc: 'Crafts investor pitch decks, TAM/SAM/SOM calculations, growth loops, and unit economics.',
    promptPrefix: 'You are TOM acting as a high-growth startup founder and venture advisor.'
  }
];

class PersonasManager {
  constructor() {
    this.personas = TOM_PERSONAS;
    this.currentPersonaId = 'tom-ultra';
  }

  init() {
    this.renderGrid();
    document.getElementById('btnOpenPersonas')?.addEventListener('click', () => this.openModal());
    document.getElementById('btnClosePersonasModal')?.addEventListener('click', () => this.closeModal());
  }

  renderGrid() {
    const grid = document.getElementById('personasGrid');
    if (!grid) return;

    grid.innerHTML = '';
    this.personas.forEach(p => {
      const card = document.createElement('div');
      card.className = `persona-card ${p.id === this.currentPersonaId ? 'active' : ''}`;
      card.innerHTML = `
        <div class="persona-icon">${p.icon}</div>
        <div class="persona-info">
          <span class="persona-title">${p.name}</span>
          <span style="font-size:11px; color:#38bdf8; font-weight:600;">${p.role}</span>
          <span class="persona-desc">${p.desc}</span>
        </div>
      `;
      card.addEventListener('click', () => this.selectPersona(p.id));
      grid.appendChild(card);
    });
  }

  selectPersona(id) {
    this.currentPersonaId = id;
    const persona = this.personas.find(p => p.id === id);
    if (!persona) return;

    if (window.app) {
      window.app.settings.systemPrompt = persona.promptPrefix;
      window.app.storage.saveSettings(window.app.settings);
      window.app.showToast(`Active Persona: ${persona.name}`);
    }

    this.renderGrid();
    this.closeModal();
  }

  openModal() {
    document.getElementById('personasModal')?.classList.add('active');
  }

  closeModal() {
    document.getElementById('personasModal')?.classList.remove('active');
  }
}

window.PersonasManager = PersonasManager;
