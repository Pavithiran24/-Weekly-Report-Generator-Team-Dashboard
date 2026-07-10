import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Loader2, MessageSquare, Minimize2, Send, Sparkles, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import { assistantApi } from '../../api/assistantApi'

const QUICK_PROMPTS = [
  'What did the team work on last week?',
  'Show me the blockers that need follow-up.',
  'Is there any workload imbalance right now?',
]

export default function ChatAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'I can summarize team activity, highlight blockers, and help you inspect workload trends.',
    },
  ])
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  const recentHistory = useMemo(() => messages.slice(-8), [messages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isOpen])

  const sendMessage = async (content) => {
    const trimmed = content.trim()
    if (!trimmed || isLoading) return

    setMessages((current) => [...current, { role: 'user', content: trimmed }])
    setInput('')
    setIsLoading(true)

    try {
      const response = await assistantApi.chat({
        message: trimmed,
        history: recentHistory.filter((item) => item.content !== trimmed),
      })
      const payload = response.data
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: payload.answer,
          summary: payload.summary,
          provider: payload.provider,
          suggestedQuestions: payload.suggested_questions || [],
        },
      ])
    } catch (error) {
      console.error(error)
      toast.error('Assistant is unavailable right now')
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'I could not reach the assistant service. Please try again in a moment.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const sendQuickPrompt = (prompt) => {
    setIsOpen(true)
    sendMessage(prompt)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/90 px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-blue-950/40 backdrop-blur-xl transition-transform hover:-translate-y-0.5"
      >
        {isOpen ? <Minimize2 size={18} /> : <MessageSquare size={18} />}
        {isOpen ? 'Hide Assistant' : 'AI Assistant'}
      </button>

      {isOpen ? (
        <div className="fixed bottom-20 right-5 z-40 w-[calc(100vw-2rem)] max-w-md sm:w-[28rem]">
          <Card className="overflow-hidden border border-white/10 bg-slate-950/95 p-0 shadow-2xl shadow-blue-950/50 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
              <div>
                <div className="flex items-center gap-2 text-white">
                  <Bot size={18} className="text-blue-400" />
                  <h3 className="font-semibold">Team AI Assistant</h3>
                </div>
                <p className="mt-1 text-xs text-gray-400">Manager-only insights from stored reports</p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="text-dark-300 transition-colors hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[28rem] space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'ml-auto max-w-[85%] text-right' : 'mr-auto max-w-[95%]'}>
                  <div className={`inline-block rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-blue-600 text-white' : 'border border-white/10 bg-white/5 text-gray-100'}`}>
                    {message.content}
                  </div>
                  {message.role === 'assistant' && message.summary ? (
                    <div className="mt-2 space-y-2 text-left">
                      <Badge variant="info" className="border-blue-500/20 bg-blue-500/10 text-blue-200">Summary</Badge>
                      <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-5 text-gray-300">
                        {message.summary}
                      </p>
                    </div>
                  ) : null}
                  {message.role === 'assistant' && message.provider ? (
                    <p className="mt-1 text-[11px] text-gray-500">Provider: {message.provider}</p>
                  ) : null}
                </div>
              ))}
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 size={16} className="animate-spin text-blue-400" />
                  Thinking...
                </div>
              ) : null}
              <div ref={endRef} />
            </div>

            <div className="border-t border-white/10 bg-slate-950/80 px-4 py-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendQuickPrompt(prompt)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-gray-200 transition-colors hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-white"
                  >
                    <Sparkles size={12} />
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Ask about blockers, workload, projects, or weekly activity"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      sendMessage(input)
                    }
                  }}
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-gray-500">Uses the stored report data and can fall back to a live LLM if configured.</p>
                  <Button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}>
                    <Send size={16} />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  )
}