/**
 * ============================================================================
 * TOM AI - CORE APPLICATION ORCHESTRATOR
 * ============================================================================
 * Replicates the complete ChatGPT-4o user experience with:
 * - 100% Native Autonomous Neural Engine
 * - Split-Screen Canvas / Artifacts Runner
 * - Full-Duplex Voice Call Mode with Fluid Orb
 * - Comprehensive History, Theme & Export Systems
 * ============================================================================
 */

class TomApp {
  constructor() {
    this.storage = StorageManager;
    this.settings = this.storage.getSettings();
    this.chats = this.storage.getChats();
    this.currentChatId = this.storage.getCurrentChatId() || this.chats[0]?.id;
    this.aiEngine = new AIEngine();
    this.speech = new SpeechEngine();
    this.trainingStudio = new TrainingStudio();
    this.canvasArtifacts = null;
    this.voiceMode = null;
    this.isStreaming = false;
    this.attachments = [];
    this.searchMode = this.settings.enableWebSearch;

    this.init();
  }

  init() {
    // 1. Theme
    this.applyTheme(this.settings.theme);

    // 2. Cache DOM
    this.cacheDom();

    // 3. Sub-modules
    this.canvasArtifacts = new CanvasArtifacts();
    window.canvasArtifacts = this.canvasArtifacts;

    this.voiceMode = new VoiceModeManager();
    window.voiceMode = this.voiceMode;

    // 4. Register Event Listeners
    this.bindEvents();

    // 5. Render Initial State
    this.renderSidebar();
    this.loadChat(this.currentChatId);

    // 6. Initialize Training Studio
    this.trainingStudio.init();

    // 7. Update Model Label
    this.updateModelSelectorUI(this.settings.model);
  }

  cacheDom() {
    this.sidebar = document.getElementById('sidebar');
    this.btnSidebarToggle = document.getElementById('btnSidebarToggle');
    this.btnSidebarCollapse = document.getElementById('btnSidebarCollapse');
    this.btnNewChat = document.getElementById('btnNewChat');
    this.chatHistoryList = document.getElementById('chatHistoryList');
    this.chatSearchInput = document.getElementById('chatSearchInput');

    this.modelSelectorBtn = document.getElementById('modelSelectorBtn');
    this.modelDropdownMenu = document.getElementById('modelDropdownMenu');
    this.selectedModelTitle = document.getElementById('selectedModelTitle');

    this.chatScrollArea = document.getElementById('chatScrollArea');
    this.chatContainer = document.getElementById('chatContainer');
    this.welcomeHero = document.getElementById('welcomeHero');

    this.chatTextarea = document.getElementById('chatTextarea');
    this.btnSubmit = document.getElementById('btnSubmit');
    this.btnWebSearch = document.getElementById('btnWebSearch');
    this.btnAttachFile = document.getElementById('btnAttachFile');
    this.fileInput = document.getElementById('fileInput');
    this.btnVoiceInput = document.getElementById('btnVoiceInput');
    this.attachmentsPreview = document.getElementById('attachmentsPreview');

    // Modals
    this.settingsModal = document.getElementById('settingsModal');
    this.trainingModal = document.getElementById('trainingModal');
    this.exportModal = document.getElementById('exportModal');
    this.githubPagesModal = document.getElementById('githubPagesModal');
    this.downloadsModal = document.getElementById('downloadsModal');
    this.brandingModal = document.getElementById('brandingModal');
    this.toastContainer = document.getElementById('toastContainer');
  }

  bindEvents() {
    // Download Center modal
    const openDownloads = () => {
      this.closeAllModals();
      this.downloadsModal?.classList.add('active');
    };
    document.getElementById('btnHeaderDownload')?.addEventListener('click', openDownloads);
    document.getElementById('btnOpenDownloadsModal')?.addEventListener('click', openDownloads);
    document.getElementById('btnCloseDownloadsModal')?.addEventListener('click', () => {
      this.downloadsModal?.classList.remove('active');
    });

    // Branding & Video modal
    const openBranding = () => {
      this.closeAllModals();
      this.brandingModal?.classList.add('active');
      const video = document.getElementById('commercialVideoPlayer');
      if (video) video.currentTime = 0;
    };
    document.getElementById('btnHeaderBranding')?.addEventListener('click', openBranding);
    document.getElementById('btnOpenBrandingModal')?.addEventListener('click', openBranding);
    document.getElementById('btnCloseBrandingModal')?.addEventListener('click', () => {
      this.brandingModal?.classList.remove('active');
      const video = document.getElementById('commercialVideoPlayer');
      if (video) video.pause();
    });

    // GitHub Pages modal
    document.getElementById('btnOpenGitHubPagesModal')?.addEventListener('click', () => {
      this.closeAllModals();
      this.githubPagesModal?.classList.add('active');
    });
    document.getElementById('btnCloseGitHubPagesModal')?.addEventListener('click', () => {
      this.githubPagesModal?.classList.remove('active');
    });

    // Subsystem initializations
    if (window.PersonasManager) {
      this.personasManager = new PersonasManager();
      this.personasManager.init();
      window.personasManager = this.personasManager;
    }
    if (window.AudioEffects) {
      this.audio = new AudioEffects();
      window.audioEffects = this.audio;
    }
    // Sidebar toggle
    this.btnSidebarToggle?.addEventListener('click', () => {
      this.sidebar.classList.toggle('open');
      this.sidebar.classList.toggle('collapsed');
    });

    this.btnSidebarCollapse?.addEventListener('click', () => {
      this.sidebar.classList.add('collapsed');
      this.sidebar.classList.remove('open');
    });

    // New Chat
    this.btnNewChat?.addEventListener('click', () => this.createNewChat());

    // Search conversations
    this.chatSearchInput?.addEventListener('input', (e) => this.filterChatHistory(e.target.value));

    // Model Selector Dropdown
    this.modelSelectorBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.modelDropdownMenu.classList.toggle('active');
      this.modelSelectorBtn.classList.toggle('open');
    });

    document.querySelectorAll('.model-option').forEach(option => {
      option.addEventListener('click', () => {
        const modelId = option.getAttribute('data-model');
        this.selectModel(modelId);
        this.modelDropdownMenu.classList.remove('active');
        this.modelSelectorBtn.classList.remove('open');
      });
    });

    document.addEventListener('click', () => {
      this.modelDropdownMenu?.classList.remove('active');
      this.modelSelectorBtn?.classList.remove('open');
    });

    // Chat Textarea Auto-Resize & Shortcuts
    this.chatTextarea?.addEventListener('input', () => {
      this.autoResizeTextarea();
      this.updateSubmitButtonState();
    });

    this.chatTextarea?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });

    // Submit / Stop button
    this.btnSubmit?.addEventListener('click', () => {
      if (this.isStreaming) {
        this.stopStreaming();
      } else {
        this.handleSendMessage();
      }
    });

    // Web Search Toggle
    this.btnWebSearch?.addEventListener('click', () => {
      this.searchMode = !this.searchMode;
      this.btnWebSearch.classList.toggle('active', this.searchMode);
      this.showToast(this.searchMode ? '🌐 Web Knowledge Grounding: ON' : '🌐 Grounding: OFF');
    });

    // Attach File
    this.btnAttachFile?.addEventListener('click', () => this.fileInput?.click());
    this.fileInput?.addEventListener('change', (e) => this.handleFileUpload(e));

    // Voice Input (dictation)
    this.btnVoiceInput?.addEventListener('click', () => this.handleVoiceInput());

    // Global Key Shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.createNewChat();
      }
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Header buttons
    document.getElementById('btnOpenTrainingHub')?.addEventListener('click', () => this.openTrainingModal());
    document.getElementById('btnHeaderStudio')?.addEventListener('click', () => this.openTrainingModal());
    document.getElementById('btnCloseTrainingModal')?.addEventListener('click', () => this.closeTrainingModal());

    document.getElementById('btnOpenSettings')?.addEventListener('click', () => this.openSettingsModal());
    document.getElementById('btnCloseSettingsModal')?.addEventListener('click', () => this.closeSettingsModal());
    document.getElementById('btnSaveSettings')?.addEventListener('click', () => this.saveSettingsFromForm());

    // Theme Toggle
    document.getElementById('btnThemeToggle')?.addEventListener('click', () => {
      const nextTheme = this.settings.theme === 'dark' ? 'light' : this.settings.theme === 'light' ? 'oled' : 'dark';
      this.applyTheme(nextTheme);
      this.settings.theme = nextTheme;
      this.storage.saveSettings(this.settings);
      this.showToast(`Theme: ${nextTheme.toUpperCase()}`);
    });

    // Clear Chat
    document.getElementById('btnClearChat')?.addEventListener('click', () => this.clearCurrentChat());

    // Export Chat button
    document.getElementById('btnExportChat')?.addEventListener('click', () => this.openExportModal());
    document.getElementById('btnCloseExportModal')?.addEventListener('click', () => this.closeExportModal());

    // Training Studio events
    document.getElementById('btnStartTraining')?.addEventListener('click', () => {
      this.trainingStudio.startTrainingSimulation();
    });

    document.getElementById('btnAddDatasetPair')?.addEventListener('click', () => {
      const prompt = document.getElementById('inputNewPrompt')?.value || '';
      const completion = document.getElementById('inputNewCompletion')?.value || '';
      const category = document.getElementById('selectNewCategory')?.value || 'Custom Knowledge';

      if (!prompt.trim() || !completion.trim()) {
        this.showToast('Please fill in both Prompt and Completion fields.');
        return;
      }

      this.trainingStudio.addCustomDatasetPair(prompt, completion, category);
      document.getElementById('inputNewPrompt').value = '';
      document.getElementById('inputNewCompletion').value = '';
      this.showToast('✓ Training sample fine-tuned into TOM weights!');
    });
  }

  autoResizeTextarea() {
    if (!this.chatTextarea) return;
    this.chatTextarea.style.height = 'auto';
    const newHeight = Math.min(this.chatTextarea.scrollHeight, 200);
    this.chatTextarea.style.height = Math.max(newHeight, 24) + 'px';
  }

  updateSubmitButtonState() {
    if (!this.btnSubmit) return;
    const hasText = this.chatTextarea.value.trim().length > 0;
    const hasAttachments = this.attachments.length > 0;
    this.btnSubmit.disabled = !this.isStreaming && !hasText && !hasAttachments;
  }

  applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-oled');
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else if (theme === 'oled') {
      document.body.classList.add('theme-oled');
    }
  }

  selectModel(modelId) {
    this.settings.model = modelId;
    this.storage.saveSettings(this.settings);
    this.updateModelSelectorUI(modelId);

    const chat = this.getCurrentChat();
    if (chat) {
      chat.model = modelId;
      this.storage.saveChats(this.chats);
    }

    const titles = {
      'tom-4.5-ultra': 'TOM 4.5 Ultra',
      'tom-o1-reasoning': 'TOM o1 Reasoning',
      'tom-speed-mini': 'TOM Speed Mini',
      'tom-code-pro': 'TOM Code Pro'
    };

    this.showToast(`Active Model: ${titles[modelId] || modelId}`);
  }

  updateModelSelectorUI(modelId) {
    const titles = {
      'tom-4.5-ultra': 'TOM 4.5 Ultra',
      'tom-o1-reasoning': 'TOM o1 Reasoning',
      'tom-speed-mini': 'TOM Speed Mini',
      'tom-code-pro': 'TOM Code Pro'
    };

    if (this.selectedModelTitle) {
      this.selectedModelTitle.textContent = titles[modelId] || 'TOM 4.5 Ultra';
    }

    document.querySelectorAll('.model-option').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-model') === modelId);
    });
  }

  getCurrentChat() {
    return this.chats.find(c => c.id === this.currentChatId) || this.chats[0];
  }

  createNewChat() {
    const newChat = {
      id: 'chat-' + Date.now(),
      title: 'New conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      model: this.settings.model,
      messages: []
    };

    this.chats.unshift(newChat);
    this.currentChatId = newChat.id;
    this.storage.saveChats(this.chats);
    this.storage.setCurrentChatId(this.currentChatId);

    this.renderSidebar();
    this.loadChat(this.currentChatId);
    this.chatTextarea?.focus();
  }

  loadChat(chatId) {
    this.currentChatId = chatId;
    this.storage.setCurrentChatId(chatId);

    const chat = this.getCurrentChat();
    if (!chat) return;

    document.querySelectorAll('.chat-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-chat-id') === chatId);
    });

    if (chat.model) {
      this.updateModelSelectorUI(chat.model);
    }

    this.renderChatMessages(chat);
  }

  renderChatMessages(chat) {
    if (!this.chatContainer) return;
    this.chatContainer.innerHTML = '';

    if (!chat.messages || chat.messages.length === 0) {
      this.welcomeHero.style.display = 'flex';
      return;
    }

    this.welcomeHero.style.display = 'none';

    chat.messages.forEach(msg => {
      this.appendMessageElement(msg, false);
    });

    this.scrollToBottom();
  }

  appendMessageElement(msg, animate = true) {
    const isUser = msg.role === 'user';
    const row = document.createElement('div');
    row.className = `message-row ${isUser ? 'user-row' : 'assistant-row'}`;
    row.setAttribute('data-msg-id', msg.id);

    const avatarHtml = isUser
      ? `<div class="msg-avatar user-avatar">U</div>`
      : `<div class="msg-avatar tom-avatar"><img src="./assets/logo.svg" alt="TOM"></div>`;

    let thoughtHtml = '';
    if (msg.thought) {
      thoughtHtml = `
        <div class="thought-box">
          <div class="thought-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
            <div class="thought-title">
              <span class="thought-pulse-dot"></span>
              <span>Thought Process (Reasoning Steps)</span>
            </div>
            <span style="font-size:11px;">▼</span>
          </div>
          <div class="thought-details">${MarkdownRenderer.escapeHtml(msg.thought)}</div>
        </div>
      `;
    }

    const bubbleHtml = isUser
      ? `<div class="msg-bubble user-bubble">${MarkdownRenderer.escapeHtml(msg.content)}</div>`
      : `
        <div class="msg-bubble assistant-bubble">
          ${thoughtHtml}
          <div class="markdown-body msg-content-target">${MarkdownRenderer.render(msg.content)}</div>
          <div class="msg-toolbar">
            <button class="btn-msg-action" title="Copy response" onclick="app.copyMessage('${msg.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            <button class="btn-msg-action" title="Listen aloud" onclick="app.speakMessage('${msg.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            </button>
            <button class="btn-msg-action" title="Regenerate" onclick="app.regenerateLastMessage()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
            </button>
            <button class="btn-msg-action" title="Good response" onclick="app.rateMessage('${msg.id}', 'up', this)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
            </button>
          </div>
        </div>
      `;

    row.innerHTML = `
      ${isUser ? '' : avatarHtml}
      <div class="msg-content-wrapper">
        ${bubbleHtml}
      </div>
      ${isUser ? avatarHtml : ''}
    `;

    this.chatContainer.appendChild(row);

    // Inject "Open in Canvas" buttons into code blocks
    this.enhanceCodeBlocksWithCanvas(row);

    if (animate) this.scrollToBottom();
    return row;
  }

  enhanceCodeBlocksWithCanvas(parentElement) {
    const blocks = parentElement.querySelectorAll('.code-block-wrapper');
    blocks.forEach(block => {
      const actions = block.querySelector('.code-header-actions');
      const langLabel = block.querySelector('.code-lang-label')?.textContent || 'code';
      if (actions && !actions.querySelector('.btn-open-canvas')) {
        const btn = document.createElement('button');
        btn.className = 'btn-code-action btn-open-canvas';
        btn.title = 'Open code in Canvas split-screen workspace';
        btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg> Open in Canvas`;
        btn.addEventListener('click', () => {
          const rawCode = MarkdownRenderer._snippets?.[block.id] || block.querySelector('code')?.textContent || '';
          this.canvasArtifacts.open('Interactive Code Workspace', langLabel, rawCode);
        });
        actions.prepend(btn);
      }
    });
  }

  renderSidebar() {
    if (!this.chatHistoryList) return;
    this.chatHistoryList.innerHTML = '';

    const sorted = [...this.chats].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    sorted.forEach(chat => {
      const item = document.createElement('div');
      item.className = `chat-item ${chat.id === this.currentChatId ? 'active' : ''}`;
      item.setAttribute('data-chat-id', chat.id);

      item.innerHTML = `
        <span class="chat-item-title">${MarkdownRenderer.escapeHtml(chat.title)}</span>
        <div class="chat-item-actions">
          <button class="chat-action-btn" title="Rename" onclick="event.stopPropagation(); app.renameChat('${chat.id}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button class="chat-action-btn" title="Delete" onclick="event.stopPropagation(); app.deleteChat('${chat.id}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;

      item.addEventListener('click', () => this.loadChat(chat.id));
      this.chatHistoryList.appendChild(item);
    });
  }

  renameChat(chatId) {
    const chat = this.chats.find(c => c.id === chatId);
    if (!chat) return;
    const newTitle = prompt('Enter new conversation title:', chat.title);
    if (newTitle && newTitle.trim()) {
      chat.title = newTitle.trim();
      chat.updatedAt = new Date().toISOString();
      this.storage.saveChats(this.chats);
      this.renderSidebar();
    }
  }

  deleteChat(chatId) {
    if (this.chats.length <= 1) {
      this.showToast('Cannot delete the last conversation.');
      return;
    }
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    this.chats = this.chats.filter(c => c.id !== chatId);
    if (this.currentChatId === chatId) {
      this.currentChatId = this.chats[0].id;
    }
    this.storage.saveChats(this.chats);
    this.renderSidebar();
    this.loadChat(this.currentChatId);
    this.showToast('Conversation deleted.');
  }

  clearCurrentChat() {
    const chat = this.getCurrentChat();
    if (!chat) return;
    if (!confirm('Clear all messages in this conversation?')) return;
    chat.messages = [];
    chat.updatedAt = new Date().toISOString();
    this.storage.saveChats(this.chats);
    this.renderChatMessages(chat);
  }

  filterChatHistory(query) {
    const q = query.toLowerCase().trim();
    document.querySelectorAll('.chat-item').forEach(item => {
      const title = item.querySelector('.chat-item-title').textContent.toLowerCase();
      item.style.display = title.includes(q) ? 'flex' : 'none';
    });
  }

  // Handle Send & Neural Streaming
  async handleSendMessage(customPrompt = null) {
    if (this.isStreaming) return;

    const text = customPrompt || this.chatTextarea.value.trim();
    if (!text && this.attachments.length === 0) return;

    const chat = this.getCurrentChat();
    if (!chat) return;

    if (!customPrompt) {
      this.chatTextarea.value = '';
      this.chatTextarea.style.height = '24px';
    }

    this.welcomeHero.style.display = 'none';

    // 1. User Message
    this.audio?.playSend();
    let fullUserContent = text;
    if (this.attachments.length > 0) {
      const attachSummary = this.attachments.map(a => `[Attached File: ${a.name} (${a.type})]\n${a.content || ''}`).join('\n\n');
      fullUserContent = attachSummary ? `${attachSummary}\n\n${text}` : text;
      this.attachments = [];
      this.renderAttachmentsPreview();
    }

    const userMsg = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: fullUserContent,
      timestamp: new Date().toISOString()
    };

    chat.messages.push(userMsg);

    if (chat.messages.length === 1) {
      chat.title = text.slice(0, 32) + (text.length > 32 ? '...' : '');
      this.renderSidebar();
    }

    this.appendMessageElement(userMsg, true);

    // 2. Assistant Placeholder
    const assistantMsgId = 'msg-' + (Date.now() + 1);
    const assistantRow = document.createElement('div');
    assistantRow.className = 'message-row assistant-row';
    assistantRow.setAttribute('data-msg-id', assistantMsgId);

    assistantRow.innerHTML = `
      <div class="msg-avatar tom-avatar"><img src="./assets/logo.svg" alt="TOM"></div>
      <div class="msg-content-wrapper">
        <div class="msg-bubble assistant-bubble">
          <div class="thought-target"></div>
          <div class="markdown-body msg-content-target"><span class="streaming-cursor"></span></div>
        </div>
      </div>
    `;

    this.chatContainer.appendChild(assistantRow);
    this.scrollToBottom();

    const contentTarget = assistantRow.querySelector('.msg-content-target');
    const thoughtTarget = assistantRow.querySelector('.thought-target');

    // 3. Initiate Streaming from Autonomous Neural Engine
    this.isStreaming = true;
    this.btnSubmit.classList.add('streaming');
    this.btnSubmit.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16"></rect></svg>`;

    let accumulatedContent = '';
    let thoughtText = '';

    try {
      const stream = this.aiEngine.chatStream({
        messages: chat.messages,
        model: chat.model || this.settings.model,
        systemPrompt: this.settings.systemPrompt,
        temperature: this.settings.temperature,
        searchMode: this.searchMode,
        onThought: (thought) => {
          thoughtText = thought;
          thoughtTarget.innerHTML = `
            <div class="thought-box">
              <div class="thought-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                <div class="thought-title">
                  <span class="thought-pulse-dot"></span>
                  <span>Thought Process (Reasoning Steps)</span>
                </div>
                <span style="font-size:11px;">▼</span>
              </div>
              <div class="thought-details">${MarkdownRenderer.escapeHtml(thought)}</div>
            </div>
          `;
          this.scrollToBottom();
        }
      });

      for await (const chunk of stream) {
        accumulatedContent += chunk;
        contentTarget.innerHTML = MarkdownRenderer.render(accumulatedContent) + '<span class="streaming-cursor"></span>';
        this.scrollToBottom();
      }

      // Finish streaming
      this.audio?.playDone();
      contentTarget.innerHTML = MarkdownRenderer.render(accumulatedContent);

      const assistantMsg = {
        id: assistantMsgId,
        role: 'assistant',
        content: accumulatedContent,
        thought: thoughtText || null,
        timestamp: new Date().toISOString()
      };

      chat.messages.push(assistantMsg);
      chat.updatedAt = new Date().toISOString();
      this.storage.saveChats(this.chats);
      this.renderSidebar();

      // Message Action Toolbar
      const bubble = assistantRow.querySelector('.assistant-bubble');
      const toolbar = document.createElement('div');
      toolbar.className = 'msg-toolbar';
      toolbar.innerHTML = `
        <button class="btn-msg-action" title="Copy response" onclick="app.copyMessage('${assistantMsgId}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
        <button class="btn-msg-action" title="Listen aloud" onclick="app.speakMessage('${assistantMsgId}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        </button>
        <button class="btn-msg-action" title="Regenerate" onclick="app.regenerateLastMessage()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
        </button>
        <button class="btn-msg-action" title="Good response" onclick="app.rateMessage('${assistantMsgId}', 'up', this)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
        </button>
      `;
      bubble.appendChild(toolbar);

      // Enhance code blocks with Canvas button
      this.enhanceCodeBlocksWithCanvas(assistantRow);

    } catch (err) {
      console.error('Inference error', err);
      contentTarget.innerHTML = `<span style="color:#f87171;">⚠️ Generation issue: ${MarkdownRenderer.escapeHtml(err.message)}</span>`;
    } finally {
      this.isStreaming = false;
      this.btnSubmit.classList.remove('streaming');
      this.btnSubmit.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h5v8h6v-8h5z"></path></svg>`;
      this.updateSubmitButtonState();
    }
  }

  stopStreaming() {
    if (this.isStreaming) {
      this.aiEngine.abort();
      this.isStreaming = false;
      this.btnSubmit.classList.remove('streaming');
      this.btnSubmit.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h5v8h6v-8h5z"></path></svg>`;
    }
  }

  regenerateLastMessage() {
    const chat = this.getCurrentChat();
    if (!chat || chat.messages.length === 0) return;

    if (chat.messages[chat.messages.length - 1].role === 'assistant') {
      chat.messages.pop();
    }
    const lastUserMsg = chat.messages[chat.messages.length - 1];
    if (lastUserMsg && lastUserMsg.role === 'user') {
      chat.messages.pop();
      this.renderChatMessages(chat);
      this.handleSendMessage(lastUserMsg.content);
    }
  }

  sendQuickPrompt(text) {
    this.handleSendMessage(text);
  }

  handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.attachments.push({
          name: file.name,
          type: file.type || 'text',
          content: ev.target.result
        });
        this.renderAttachmentsPreview();
      };
      reader.readAsText(file);
    });

    e.target.value = '';
  }

  renderAttachmentsPreview() {
    if (!this.attachmentsPreview) return;
    this.attachmentsPreview.innerHTML = '';

    this.attachments.forEach((att, idx) => {
      const badge = document.createElement('div');
      badge.className = 'attachment-badge';
      badge.innerHTML = `
        <span>📄 ${MarkdownRenderer.escapeHtml(att.name)}</span>
        <button class="remove-btn" onclick="app.removeAttachment(${idx})">✕</button>
      `;
      this.attachmentsPreview.appendChild(badge);
    });

    this.updateSubmitButtonState();
  }

  removeAttachment(index) {
    this.attachments.splice(index, 1);
    this.renderAttachmentsPreview();
  }

  handleVoiceInput() {
    if (this.speech.isListening) {
      this.speech.stopListening();
      this.btnVoiceInput.classList.remove('active');
    } else {
      this.btnVoiceInput.classList.add('active');
      this.showToast('🎙️ Listening... Speak now.');
      this.speech.startListening(
        (transcript) => {
          this.chatTextarea.value = (this.chatTextarea.value + ' ' + transcript).trim();
          this.autoResizeTextarea();
          this.updateSubmitButtonState();
          this.btnVoiceInput.classList.remove('active');
        },
        (error) => {
          this.btnVoiceInput.classList.remove('active');
          this.showToast(`Voice notice: ${error}`);
        }
      );
    }
  }

  copyMessage(msgId) {
    const chat = this.getCurrentChat();
    const msg = chat?.messages.find(m => m.id === msgId);
    if (!msg) return;

    navigator.clipboard.writeText(msg.content).then(() => {
      this.showToast('✓ Response copied to clipboard!');
    });
  }

  speakMessage(msgId) {
    const chat = this.getCurrentChat();
    const msg = chat?.messages.find(m => m.id === msgId);
    if (!msg) return;

    if (this.speech.isSpeaking) {
      this.speech.stop();
      this.showToast('Speech stopped.');
    } else {
      this.showToast('🔊 Speaking message...');
      this.speech.speak(msg.content, () => {
        this.showToast('Speech finished.');
      });
    }
  }

  rateMessage(msgId, rating, btn) {
    btn.classList.add('active');
    this.showToast(rating === 'up' ? '👍 Thanks for positive feedback!' : '👎 Feedback recorded for neural weights fine-tuning.');
  }

  openTrainingModal() {
    this.trainingModal?.classList.add('active');
    this.trainingStudio.resizeCanvas();
  }

  closeTrainingModal() {
    this.trainingModal?.classList.remove('active');
  }

  openSettingsModal() {
    document.getElementById('settingThemeSelect').value = this.settings.theme;
    document.getElementById('settingSystemPrompt').value = this.settings.systemPrompt;
    document.getElementById('settingTemperature').value = this.settings.temperature;
    document.getElementById('tempValDisplay').textContent = this.settings.temperature;

    this.settingsModal?.classList.add('active');
  }

  closeSettingsModal() {
    this.settingsModal?.classList.remove('active');
  }

  saveSettingsFromForm() {
    this.settings.theme = document.getElementById('settingThemeSelect').value;
    this.settings.systemPrompt = document.getElementById('settingSystemPrompt').value.trim();
    this.settings.temperature = parseFloat(document.getElementById('settingTemperature').value);

    this.storage.saveSettings(this.settings);
    this.applyTheme(this.settings.theme);
    this.closeSettingsModal();
    this.showToast('✓ Settings updated.');
  }

  openExportModal() {
    this.exportModal?.classList.add('active');
  }

  closeExportModal() {
    this.exportModal?.classList.remove('active');
  }

  exportCurrentChat(format) {
    const chat = this.getCurrentChat();
    if (!chat) return;

    let content = '';
    let mimeType = 'text/plain';
    let ext = 'txt';

    if (format === 'markdown') {
      content = `# ${chat.title}\n*Exported from TOM AI on ${new Date().toLocaleString()}*\n\n---\n\n` +
        chat.messages.map(m => `### ${m.role === 'user' ? '👤 User' : '🤖 TOM'}\n\n${m.content}\n`).join('\n---\n\n');
      mimeType = 'text/markdown';
      ext = 'md';
    } else if (format === 'json') {
      content = JSON.stringify(chat, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else if (format === 'html') {
      content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${MarkdownRenderer.escapeHtml(chat.title)}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;color:#222;}h1{border-bottom:1px solid #eee;padding-bottom:10px;}.msg{margin:24px 0;padding:16px;border-radius:8px;}.user{background:#f1f5f9;}.tom{background:#f8fafc;border-left:4px solid #10b981;}</style></head><body><h1>${MarkdownRenderer.escapeHtml(chat.title)}</h1>` +
        chat.messages.map(m => `<div class="msg ${m.role === 'user' ? 'user' : 'tom'}"><strong>${m.role === 'user' ? 'User' : 'TOM AI'}:</strong><br>${MarkdownRenderer.render(m.content)}</div>`).join('') +
        `</body></html>`;
      mimeType = 'text/html';
      ext = 'html';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title.replace(/\s+/g, '_').toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    this.closeExportModal();
    this.showToast(`✓ Exported conversation as .${ext}`);
  }

  closeAllModals() {
    this.closeSettingsModal();
    this.closeTrainingModal();
    this.closeExportModal();
    this.githubPagesModal?.classList.remove('active');
    this.downloadsModal?.classList.remove('active');
    this.brandingModal?.classList.remove('active');
    const video = document.getElementById('commercialVideoPlayer');
    if (video) video.pause();
    document.getElementById('personasModal')?.classList.remove('active');
    this.canvasArtifacts?.close();
    this.voiceMode?.close();
  }

  switchDownloadTab(tab) {
    const tabs = ['android', 'windows', 'hashes'];
    tabs.forEach(t => {
      const btn = document.getElementById('tabBtn' + t.charAt(0).toUpperCase() + t.slice(1));
      const panel = document.getElementById('panel' + t.charAt(0).toUpperCase() + t.slice(1));
      if (t === tab) {
        btn?.classList.add('active');
        panel?.classList.add('active');
      } else {
        btn?.classList.remove('active');
        panel?.classList.remove('active');
      }
    });
  }

  showToast(message, duration = 3000) {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  scrollToBottom() {
    if (this.chatScrollArea) {
      this.chatScrollArea.scrollTop = this.chatScrollArea.scrollHeight;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new TomApp();
  window.trainingStudio = window.app.trainingStudio;
});
