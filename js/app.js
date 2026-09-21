/**
 * TOM AI - Main Application Controller
 * Replicates the complete ChatGPT-4o user experience, streaming pipeline,
 * and state management.
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
    this.isStreaming = false;
    this.attachments = [];
    this.searchMode = this.settings.enableWebSearch;

    this.init();
  }

  init() {
    // 1. Apply saved theme
    this.applyTheme(this.settings.theme);

    // 2. Setup DOM References
    this.cacheDom();

    // 3. Register Event Listeners
    this.bindEvents();

    // 4. Render Sidebar and Current Chat
    this.renderSidebar();
    this.loadChat(this.currentChatId);

    // 5. Initialize Training Studio
    this.trainingStudio.init();

    // 6. Update Model Display
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
    this.toastContainer = document.getElementById('toastContainer');
  }

  bindEvents() {
    // Sidebar Toggles
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

    // Search chats
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

    // Close dropdown on outside click
    document.addEventListener('click', () => {
      this.modelDropdownMenu?.classList.remove('active');
      this.modelSelectorBtn?.classList.remove('open');
    });

    // Chat Textarea Auto-Resize & Submit Shortcuts
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
      this.showToast(this.searchMode ? '🌐 Web Search Grounding: ON' : '🌐 Web Search: OFF');
    });

    // File Attachments
    this.btnAttachFile?.addEventListener('click', () => this.fileInput?.click());
    this.fileInput?.addEventListener('change', (e) => this.handleFileUpload(e));

    // Voice Input
    this.btnVoiceInput?.addEventListener('click', () => this.handleVoiceInput());

    // Global Key Shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+K or Cmd+K -> New chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.createNewChat();
      }
      // Esc -> close open modals
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Open Training Studio Modal
    document.getElementById('btnOpenTrainingHub')?.addEventListener('click', () => this.openTrainingModal());
    document.getElementById('btnHeaderStudio')?.addEventListener('click', () => this.openTrainingModal());
    document.getElementById('btnCloseTrainingModal')?.addEventListener('click', () => this.closeTrainingModal());

    // Open Settings Modal
    document.getElementById('btnOpenSettings')?.addEventListener('click', () => this.openSettingsModal());
    document.getElementById('btnCloseSettingsModal')?.addEventListener('click', () => this.closeSettingsModal());
    document.getElementById('btnSaveSettings')?.addEventListener('click', () => this.saveSettingsFromForm());

    // Settings Theme Toggle
    document.getElementById('settingThemeSelect')?.addEventListener('change', (e) => {
      this.applyTheme(e.target.value);
    });

    // Theme toggle in header
    document.getElementById('btnThemeToggle')?.addEventListener('click', () => {
      const nextTheme = this.settings.theme === 'dark' ? 'light' : this.settings.theme === 'light' ? 'oled' : 'dark';
      this.applyTheme(nextTheme);
      this.settings.theme = nextTheme;
      this.storage.saveSettings(this.settings);
      this.showToast(`Theme switched to: ${nextTheme.toUpperCase()}`);
    });

    // Clear Chat in header
    document.getElementById('btnClearChat')?.addEventListener('click', () => this.clearCurrentChat());

    // Training Studio Events
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
      this.showToast('✓ Training sample embedded into TOM memory!');
    });
  }

  // Auto-resize textarea up to 200px
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

  // Model Selection
  selectModel(modelId) {
    this.settings.model = modelId;
    this.storage.saveSettings(this.settings);
    this.updateModelSelectorUI(modelId);

    // Save model to current chat
    const chat = this.getCurrentChat();
    if (chat) {
      chat.model = modelId;
      this.storage.saveChats(this.chats);
    }

    const modelNames = {
      'tom-4.5-ultra': 'TOM 4.5 Ultra',
      'tom-o1-reasoning': 'TOM o1 Reasoning',
      'tom-speed-mini': 'TOM Speed Mini',
      'tom-code-pro': 'TOM Code Pro',
      'tom-neural-local': 'TOM Local Neural'
    };

    this.showToast(`Switched to: ${modelNames[modelId] || modelId}`);
  }

  updateModelSelectorUI(modelId) {
    const titles = {
      'tom-4.5-ultra': 'TOM 4.5 Ultra',
      'tom-o1-reasoning': 'TOM o1 Reasoning',
      'tom-speed-mini': 'TOM Speed Mini',
      'tom-code-pro': 'TOM Code Pro',
      'tom-neural-local': 'TOM Local Neural'
    };

    if (this.selectedModelTitle) {
      this.selectedModelTitle.textContent = titles[modelId] || 'TOM 4.5 Ultra';
    }

    document.querySelectorAll('.model-option').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-model') === modelId);
    });
  }

  // Chat Management
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
    this.chatTextarea.focus();
  }

  loadChat(chatId) {
    this.currentChatId = chatId;
    this.storage.setCurrentChatId(chatId);

    const chat = this.getCurrentChat();
    if (!chat) return;

    // Update active state in sidebar
    document.querySelectorAll('.chat-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-chat-id') === chatId);
    });

    // Update model dropdown for this chat
    if (chat.model) {
      this.updateModelSelectorUI(chat.model);
    }

    // Render Messages
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
            <button class="btn-msg-action" title="Needs improvement" onclick="app.rateMessage('${msg.id}', 'down', this)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
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
    if (animate) this.scrollToBottom();
    return row;
  }

  renderSidebar() {
    if (!this.chatHistoryList) return;
    this.chatHistoryList.innerHTML = '';

    const sortedChats = [...this.chats].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    sortedChats.forEach(chat => {
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

  // Sending Messages & Streaming
  async handleSendMessage(customPrompt = null) {
    if (this.isStreaming) return;

    const text = customPrompt || this.chatTextarea.value.trim();
    if (!text && this.attachments.length === 0) return;

    const chat = this.getCurrentChat();
    if (!chat) return;

    // Reset textarea
    if (!customPrompt) {
      this.chatTextarea.value = '';
      this.chatTextarea.style.height = '24px';
    }

    // Hide welcome hero
    this.welcomeHero.style.display = 'none';

    // 1. Create and Append User Message
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

    // Auto title chat if it's the first message
    if (chat.messages.length === 1) {
      chat.title = text.slice(0, 32) + (text.length > 32 ? '...' : '');
      this.renderSidebar();
    }

    this.appendMessageElement(userMsg, true);

    // 2. Prepare Assistant Message Placeholder
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

    // 3. Initiate Streaming
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
              <div class="thought-header">
                <div class="thought-title">
                  <span class="thought-pulse-dot"></span>
                  <span>Thought Process (Reasoning Steps)</span>
                </div>
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

      // Append message action bar
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
        <button class="btn-msg-action" title="Needs improvement" onclick="app.rateMessage('${assistantMsgId}', 'down', this)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
        </button>
      `;
      bubble.appendChild(toolbar);

    } catch (err) {
      console.error('Streaming error', err);
      contentTarget.innerHTML = `<span style="color:#f87171;">⚠️ Generation interrupted: ${MarkdownRenderer.escapeHtml(err.message)}</span>`;
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

  // Quick Prompt Pill Handler
  sendQuickPrompt(text) {
    this.handleSendMessage(text);
  }

  // File Attachments
  handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      if (file.type.startsWith('image/')) {
        reader.onload = (ev) => {
          this.attachments.push({
            name: file.name,
            type: 'image',
            content: `[Image preview: ${file.name}]`,
            dataUrl: ev.target.result
          });
          this.renderAttachmentsPreview();
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (ev) => {
          this.attachments.push({
            name: file.name,
            type: 'text',
            content: ev.target.result
          });
          this.renderAttachmentsPreview();
        };
        reader.readAsText(file);
      }
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

  // Voice Input
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
          this.showToast(`Voice input notice: ${error}`);
        }
      );
    }
  }

  // Message Actions
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
    this.showToast(rating === 'up' ? '👍 Thanks for the feedback!' : '👎 Feedback recorded for model tuning.');
  }

  // Modal Open / Close
  openTrainingModal() {
    this.trainingModal?.classList.add('active');
    this.trainingStudio.resizeCanvas();
  }

  closeTrainingModal() {
    this.trainingModal?.classList.remove('active');
  }

  openSettingsModal() {
    // Populate form
    document.getElementById('settingThemeSelect').value = this.settings.theme;
    document.getElementById('settingProviderSelect').value = this.settings.provider;
    document.getElementById('settingApiKeyInput').value = this.settings.apiKey || '';
    document.getElementById('settingCustomEndpointInput').value = this.settings.apiEndpoint || '';
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
    this.settings.provider = document.getElementById('settingProviderSelect').value;
    this.settings.apiKey = document.getElementById('settingApiKeyInput').value.trim();
    this.settings.apiEndpoint = document.getElementById('settingCustomEndpointInput').value.trim();
    this.settings.systemPrompt = document.getElementById('settingSystemPrompt').value.trim();
    this.settings.temperature = parseFloat(document.getElementById('settingTemperature').value);

    this.storage.saveSettings(this.settings);
    this.applyTheme(this.settings.theme);
    this.closeSettingsModal();
    this.showToast('✓ Settings successfully saved.');
  }

  closeAllModals() {
    this.closeSettingsModal();
    this.closeTrainingModal();
  }

  // Toast System
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

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new TomApp();
  window.trainingStudio = window.app.trainingStudio;
});
