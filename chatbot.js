(function () {
  const ACCENT = '#C4715A';
  const HISTORY_LIMIT = 10;
  const WELCOME_MESSAGE = '안녕하세요! 리빙짱 챗봇 짱이예요 😊 조명, 소품, 브랜드에 대해 무엇이든 물어보세요!';

  let history = [];
  let isLoading = false;

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #ljj-chat-toggle {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: ${ACCENT};
        color: #FAF8F5;
        border: none;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(0,0,0,0.18);
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform .2s ease;
        font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
      }
      #ljj-chat-toggle:hover { transform: scale(1.06); }

      #ljj-chat-window {
        position: fixed;
        bottom: 92px;
        right: 24px;
        z-index: 9999;
        width: 360px;
        max-width: calc(100vw - 40px);
        height: 520px;
        max-height: calc(100vh - 140px);
        background: #FAF8F5;
        border-radius: 18px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.22);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
        opacity: 0;
        transform: translateY(16px) scale(0.98);
        pointer-events: none;
        transition: opacity .22s ease, transform .22s ease;
      }
      #ljj-chat-window.ljj-open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      #ljj-chat-header {
        background: ${ACCENT};
        color: #FAF8F5;
        padding: 16px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
      }
      #ljj-chat-header .ljj-title { font-weight: 600; font-size: 15px; }
      #ljj-chat-header .ljj-subtitle { font-size: 11.5px; opacity: 0.85; margin-top: 2px; }
      #ljj-chat-close {
        background: none; border: none; color: #FAF8F5; font-size: 18px; cursor: pointer; line-height: 1; padding: 4px;
      }

      #ljj-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: #FAF8F5;
      }

      .ljj-msg {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 14px;
        font-size: 13.5px;
        line-height: 1.55;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .ljj-msg.ljj-user {
        align-self: flex-end;
        background: ${ACCENT};
        color: #FAF8F5;
        border-bottom-right-radius: 4px;
      }
      .ljj-msg.ljj-bot {
        align-self: flex-start;
        background: #EDE8DF;
        color: #2C2C2C;
        border-bottom-left-radius: 4px;
      }
      .ljj-msg.ljj-error {
        align-self: flex-start;
        background: #F4D9D3;
        color: #8C3A2A;
        border-bottom-left-radius: 4px;
      }

      .ljj-typing {
        align-self: flex-start;
        display: flex;
        gap: 4px;
        padding: 12px 14px;
        background: #EDE8DF;
        border-radius: 14px;
        border-bottom-left-radius: 4px;
      }
      .ljj-typing span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #9a8f7d;
        animation: ljj-bounce 1.1s infinite ease-in-out;
      }
      .ljj-typing span:nth-child(2) { animation-delay: 0.15s; }
      .ljj-typing span:nth-child(3) { animation-delay: 0.3s; }
      @keyframes ljj-bounce {
        0%, 80%, 100% { transform: translateY(0); opacity: .5; }
        40% { transform: translateY(-4px); opacity: 1; }
      }

      #ljj-chat-input-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        border-top: 1px solid #EAE3D8;
        background: #FAF8F5;
        flex-shrink: 0;
      }
      #ljj-chat-input {
        flex: 1;
        border: 1px solid #EAE3D8;
        background: #FFFFFF;
        border-radius: 999px;
        padding: 10px 14px;
        font-size: 13.5px;
        font-family: inherit;
        outline: none;
        color: #2C2C2C;
      }
      #ljj-chat-input:focus { border-color: ${ACCENT}; }
      #ljj-chat-send {
        background: ${ACCENT};
        color: #FAF8F5;
        border: none;
        border-radius: 999px;
        width: 38px;
        height: 38px;
        flex-shrink: 0;
        cursor: pointer;
        font-size: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity .2s;
      }
      #ljj-chat-send:disabled { opacity: 0.5; cursor: not-allowed; }

      @media (max-width: 480px) {
        #ljj-chat-window {
          width: calc(100vw - 40px);
          right: 20px;
          bottom: 88px;
        }
        #ljj-chat-toggle { right: 20px; bottom: 20px; }
      }
    `;
    document.head.appendChild(style);
  }

  function buildWidget() {
    const toggle = document.createElement('button');
    toggle.id = 'ljj-chat-toggle';
    toggle.setAttribute('aria-label', '챗봇 열기');
    toggle.innerHTML = '💬';

    const win = document.createElement('div');
    win.id = 'ljj-chat-window';
    win.innerHTML = `
      <div id="ljj-chat-header">
        <div>
          <div class="ljj-title">짱이 · 리빙짱 상담봇</div>
          <div class="ljj-subtitle">조명·소품·브랜드에 대해 물어보세요</div>
        </div>
        <button id="ljj-chat-close" aria-label="챗봇 닫기">✕</button>
      </div>
      <div id="ljj-chat-messages"></div>
      <div id="ljj-chat-input-row">
        <input id="ljj-chat-input" type="text" placeholder="메시지를 입력하세요..." autocomplete="off" />
        <button id="ljj-chat-send" aria-label="전송">➤</button>
      </div>
    `;

    document.body.appendChild(toggle);
    document.body.appendChild(win);

    const messagesEl = win.querySelector('#ljj-chat-messages');
    const inputEl = win.querySelector('#ljj-chat-input');
    const sendBtn = win.querySelector('#ljj-chat-send');
    const closeBtn = win.querySelector('#ljj-chat-close');

    function openWindow() {
      win.classList.add('ljj-open');
      inputEl.focus();
    }
    function closeWindow() {
      win.classList.remove('ljj-open');
    }

    toggle.addEventListener('click', () => {
      win.classList.contains('ljj-open') ? closeWindow() : openWindow();
    });
    closeBtn.addEventListener('click', closeWindow);

    function appendMessage(role, text) {
      const el = document.createElement('div');
      el.className = `ljj-msg ljj-${role}`;
      el.textContent = text;
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return el;
    }

    function showTyping() {
      const el = document.createElement('div');
      el.className = 'ljj-typing';
      el.id = 'ljj-chat-typing';
      el.innerHTML = '<span></span><span></span><span></span>';
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function hideTyping() {
      const el = document.getElementById('ljj-chat-typing');
      if (el) el.remove();
    }

    function pushHistory(role, content) {
      history.push({ role, content });
      if (history.length > HISTORY_LIMIT) {
        history = history.slice(-HISTORY_LIMIT);
      }
    }

    async function sendMessage() {
      const text = inputEl.value.trim();
      if (!text || isLoading) return;

      appendMessage('user', text);
      pushHistory('user', text);
      inputEl.value = '';

      isLoading = true;
      sendBtn.disabled = true;
      showTyping();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history }),
        });
        const data = await res.json();
        hideTyping();

        if (!res.ok || data.error) {
          appendMessage('error', data.error || '오류가 발생했어요. 잠시 후 다시 시도해주세요.');
        } else {
          appendMessage('bot', data.reply);
          pushHistory('assistant', data.reply);
        }
      } catch (e) {
        hideTyping();
        appendMessage('error', '네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
      } finally {
        isLoading = false;
        sendBtn.disabled = false;
        inputEl.focus();
      }
    }

    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    setTimeout(() => {
      appendMessage('bot', WELCOME_MESSAGE);
      pushHistory('assistant', WELCOME_MESSAGE);
    }, 1000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    buildWidget();
  });
})();
