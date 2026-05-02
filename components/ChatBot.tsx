import React, { FormEvent, useMemo, useState } from 'react';

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Hi, I am your SAFENET cyber mentor. Ask me about OWASP, SQLi, XSS, and secure coding.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_FLASK_API_BASE_URL || 'http://127.0.0.1:5000',
    []
  );

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed })
      });
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to get AI response');
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: data.response }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Error: ${errorMessage}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
      {isOpen && (
        <div
          style={{
            width: 340,
            height: 480,
            background: '#0a0f1d',
            border: '1px solid #00e5ff',
            borderRadius: 12,
            boxShadow: '0 0 18px rgba(0, 229, 255, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            marginBottom: 12
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              background: 'linear-gradient(90deg, #10203a 0%, #061225 100%)',
              color: '#7df9ff',
              fontWeight: 700,
              borderBottom: '1px solid rgba(0, 229, 255, 0.35)'
            }}
          >
            SAFENET Cyber Assistant
          </div>

          <div
            style={{
              flex: 1,
              padding: 12,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}`}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '86%',
                  padding: '8px 10px',
                  borderRadius: 10,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.4,
                  fontSize: 13,
                  color: msg.role === 'user' ? '#00120f' : '#d6faff',
                  background: msg.role === 'user' ? '#00ff9c' : '#11263d',
                  border: msg.role === 'user' ? '1px solid #00d784' : '1px solid #1f4466'
                }}
              >
                {msg.text}
              </div>
            ))}

            {isLoading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  maxWidth: '86%',
                  padding: '8px 10px',
                  borderRadius: 10,
                  fontSize: 13,
                  color: '#9ed8ff',
                  background: '#11263d',
                  border: '1px solid #1f4466'
                }}
              >
                AI is thinking...
              </div>
            )}
          </div>

          <form
            onSubmit={sendMessage}
            style={{
              display: 'flex',
              gap: 8,
              padding: 10,
              borderTop: '1px solid rgba(0, 229, 255, 0.25)',
              background: '#0c1628'
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about OWASP or secure coding..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #1f4466',
                background: '#08101e',
                color: '#d6faff',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #00d7ff',
                background: isLoading || !input.trim() ? '#163047' : '#00d7ff',
                color: isLoading || !input.trim() ? '#8cb0c9' : '#001018',
                fontWeight: 700,
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: 62,
          height: 62,
          borderRadius: '50%',
          border: '1px solid #00e5ff',
          background: 'radial-gradient(circle at 30% 30%, #0d2538 0%, #04101d 70%)',
          color: '#7df9ff',
          fontWeight: 800,
          fontSize: 12,
          boxShadow: '0 0 14px rgba(0, 229, 255, 0.45)',
          cursor: 'pointer'
        }}
        aria-label="Toggle cybersecurity assistant chat"
      >
        {isOpen ? 'CLOSE' : 'AI'}
      </button>
    </div>
  );
};

export default ChatBot;
