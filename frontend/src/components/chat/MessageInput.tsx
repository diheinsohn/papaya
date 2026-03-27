import { useState, useRef, useCallback, type KeyboardEvent } from 'react'
import Button from '../ui/Button'

interface MessageInputProps {
  onSendMessage: (content: string) => void
  onSendOffer: (amount: number) => void
  onTyping: () => void
  disabled?: boolean
}

export default function MessageInput({ onSendMessage, onSendOffer, onTyping, disabled }: MessageInputProps) {
  const [text, setText] = useState('')
  const [offerMode, setOfferMode] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>()

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      onSendMessage(trimmed)
      setText('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } finally {
      setSending(false)
    }
  }, [text, sending, onSendMessage])

  const handleSendOffer = useCallback(async () => {
    const amount = parseInt(offerAmount.replace(/\D/g, ''), 10)
    if (!amount || amount <= 0 || sending) return
    setSending(true)
    try {
      onSendOffer(amount)
      setOfferAmount('')
      setOfferMode(false)
    } finally {
      setSending(false)
    }
  }, [offerAmount, sending, onSendOffer])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (value: string) => {
    setText(value)
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
    // Emit typing event (debounced)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(onTyping, 300)
  }

  if (offerMode) {
    return (
      <div className="sticky bottom-0 bg-white border-t border-warm-200 p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOfferMode(false)}
            className="p-2 text-warm-500 hover:text-warm-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1 flex items-center gap-2 bg-warm-50 rounded-xl px-4 py-2">
            <span className="text-warm-500 font-medium">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="Monto en CLP"
              className="flex-1 bg-transparent outline-none text-warm-800"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSendOffer()}
            />
          </div>
          <Button
            size="sm"
            onClick={handleSendOffer}
            disabled={!offerAmount || disabled || sending}
          >
            Ofertar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="sticky bottom-0 bg-white border-t border-warm-200 p-3">
      <div className="flex items-end gap-2">
        <button
          onClick={() => setOfferMode(true)}
          title="Hacer oferta"
          className="p-2 text-warm-500 hover:text-papaya-500 transition-colors shrink-0 mb-0.5"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-warm-50 rounded-xl px-4 py-2.5 outline-none text-warm-800 placeholder-warm-400 max-h-30"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!text.trim() || disabled || sending}
          className="shrink-0 mb-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </Button>
      </div>
    </div>
  )
}
