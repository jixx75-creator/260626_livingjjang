const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.4-mini';
const MAX_HISTORY_MESSAGES = 10; // 5 turns

let cachedKnowledgeBase = null;

function loadKnowledgeBase() {
  if (cachedKnowledgeBase) return cachedKnowledgeBase;

  const files = fs.readdirSync(UPLOADS_DIR).filter((f) => f.endsWith('.md'));
  const sections = files.map((file) => {
    const content = fs.readFileSync(path.join(UPLOADS_DIR, file), 'utf-8');
    return `### 문서: ${file}\n\n${content}`;
  });

  cachedKnowledgeBase = sections.join('\n\n---\n\n');
  return cachedKnowledgeBase;
}

function buildSystemPrompt() {
  const knowledgeBase = loadKnowledgeBase();
  return `당신은 "리빙짱(LIVINGJJANG)" 공식 웹사이트의 챗봇 상담원입니다. 이름은 "짱이"이고, 친근하고 따뜻한 톤으로 답합니다.

[답변 규칙 — 반드시 준수]
1. 자기소개나 일반 대화형 질문(이름, 역할, 인사 등)에는 "짱이"로서 자연스럽고 친근하게 답변하세요.
2. 리빙짱 서비스·브랜드·제품·정책에 대한 질문은 아래 [지식 베이스]에 있는 내용만 사용해 답변하세요. 지식 베이스에 없는 내용이면 절대로 지어내지 말고 "정확한 안내를 위해 무료 상담을 받아보세요"라고 안내하세요.
3. 리빙짱과 무관한 질문(날씨, 시사, 다른 브랜드 등)에는 "죄송해요, 저는 리빙짱 서비스 관련 질문만 답할 수 있어요 😊"라고 안내하세요.
4. 지식 베이스에 없는 정보는 절대 창작하지 마세요.

[지식 베이스]
${knowledgeBase}`;
}

async function handleChat(payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { status: 500, body: { error: '서버에 OPENAI_API_KEY가 설정되지 않았습니다.' } };
  }

  const message = typeof payload.message === 'string' ? payload.message.trim() : '';
  if (!message) {
    return { status: 400, body: { error: '메시지를 입력해주세요.' } };
  }

  const history = Array.isArray(payload.history) ? payload.history : [];
  const recentHistory = history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY_MESSAGES);

  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    ...recentHistory,
    { role: 'user', content: message },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI API error:', response.status, errText);
      return { status: 502, body: { error: '챗봇 응답 생성 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' } };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return { status: 502, body: { error: '챗봇 응답을 받지 못했어요. 다시 시도해주세요.' } };
    }

    return { status: 200, body: { reply } };
  } catch (e) {
    console.error('handleChat error:', e);
    return { status: 500, body: { error: '챗봇 응답 생성 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' } };
  }
}

module.exports = { handleChat, buildSystemPrompt, loadKnowledgeBase };
