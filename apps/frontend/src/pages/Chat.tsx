import { useState, useEffect, useRef } from 'react'
import { api } from '../api/client'

interface Message {
  id?: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.ai.history().then(setMessages).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', content: text }])
    setLoading(true)
    try {
      const res = await api.ai.chat(text)
      setMessages(m => [...m, { role: 'assistant', content: res.response }])
    } catch (e: any) {
      setMessages(m => [...m, { role: 'assistant', content: `Ошибка: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2>AI Тренер</h2>

      <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #ccc', padding: 12, marginBottom: 10, minHeight: 300 }}>
        {messages.length === 0 && <p style={{ color: '#888' }}>Напиши тренеру что-нибудь...</p>}
        {messages.map((m, i) => (
          <div key={i} style={{
            marginBottom: 10,
            textAlign: m.role === 'user' ? 'right' : 'left',
          }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 12px',
              background: m.role === 'user' ? '#007bff' : '#f0f0f0',
              color: m.role === 'user' ? '#fff' : '#000',
              borderRadius: 8,
              maxWidth: '80%',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {m.content}
            </span>
          </div>
        ))}
        {loading && <div style={{ color: '#888' }}>Тренер печатает...</div>}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ flex: 1 }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Сообщение..."
          disabled={loading}
        />
        <button onClick={send} disabled={loading || !input.trim()}>
          Отправить
        </button>
      </div>
    </div>
  )
}
