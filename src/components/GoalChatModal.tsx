"use client"

import { useState, useEffect, useRef } from "react"
import { X, Send, MessageCircle, Loader2 } from "lucide-react"

interface GoalChatModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SAMPLE_PROMPTS = [
  "Where am I wasting time?",
  "Which tasks give me the most energy or make me happy?",
  "How can I better align my time with my goals?",
  "What patterns do you see in my productivity?",
  "Which activities should I prioritize more?",
  "How can I improve my time management?"
]

// Function to format AI response with markdown-style formatting
const formatAIResponse = (content: string) => {
  return content
    // Format bold text (**text** -> <strong>text</strong>)
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    // Format headings (### text -> <h3>text</h3>)
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-gray-900 mt-3 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-gray-900 mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-4 mb-3">$1</h1>')
    // Format bullet points (- text -> • text)
    .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1">• $1</li>')
    // Format numbered lists (1. text -> 1. text)
    .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 mb-1">$1. $2</li>')
    // Wrap lists in ul/ol tags
    .replace(/(<li.*<\/li>)/g, '<ul class="list-none space-y-1 my-2">$1</ul>')
    // Format highlighted text with background
    .replace(/`([^`]+)`/g, '<span class="bg-yellow-100 px-1 py-0.5 rounded text-sm">$1</span>')
    // Format code blocks
    .replace(/```([^`]+)```/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
    // Add line breaks for better spacing
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
}

export default function GoalChatModal({ isOpen, onClose }: GoalChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSamplePrompts, setShowSamplePrompts] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setMessages([])
      setInputValue("")
      setShowSamplePrompts(true)
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setShowSamplePrompts(false)
    setIsLoading(true)

    try {
      const response = await fetch("/api/goals/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        const errorData = await response.json()
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorData.error || 'Unknown error'}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSamplePrompt = (prompt: string) => {
    setInputValue(prompt)
    setShowSamplePrompts(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-2 py-4 pb-20 md:px-4 md:py-6 md:pb-6">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl mx-auto transform transition-all">
          {/* Header */}
          <div className="px-4 md:px-8 py-4 md:py-6 rounded-t-3xl bg-gradient-to-r from-[#FF385C] to-[#E31C5F]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden">
                  <img 
                    src="/roozi-avatar-chat.webp" 
                    alt="Roozi" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-semibold text-white mb-1">
                    Chat with Roozi
                  </h2>
                  <p className="text-white/80 text-sm md:text-base">
                    Your AI time management assistant
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 md:p-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors" title="Close">
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex flex-col h-80 md:h-96">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4">
              {messages.length === 0 && showSamplePrompts && (
                <div className="text-center py-6 md:py-8">
                  <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <img 
                      src="/roozi-avatar-chat.webp" 
                      alt="Roozi" 
                      className="w-10 h-10 md:w-12 md:h-12 object-cover"
                    />
                  </div>
                  <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Start a conversation with Roozi</h3>
                  <p className="text-gray-500 mb-4 md:mb-6 text-sm md:text-base">Ask me anything about your goals and time patterns</p>
                  
                  <div className="grid grid-cols-1 gap-2 md:gap-3">
                    {SAMPLE_PROMPTS.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleSamplePrompt(prompt)}
                        className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-6 h-6 md:w-8 md:h-8 mr-2 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 flex-shrink-0">
                      <img 
                        src="/roozi-avatar-chat.webp" 
                        alt="Roozi" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[280px] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-[#FF385C] text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div 
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: formatAIResponse(message.content) }}
                      />
                    )}
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                                  <div className="w-6 h-6 md:w-8 md:h-8 mr-2 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 flex-shrink-0">
                  <img 
                    src="/roozi-avatar-chat.webp" 
                    alt="Roozi" 
                    className="w-full h-full object-cover"
                  />
                </div>
                  <div className="bg-gray-100 text-gray-900 max-w-[280px] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                      <span className="text-sm">Roozi is thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 p-3 md:p-4">
              <div className="flex space-x-2 md:space-x-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your goals and time patterns..."
                  className="flex-1 px-3 md:px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent text-sm md:text-base"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="px-3 md:px-4 py-2 bg-[#FF385C] text-white rounded-xl hover:bg-[#E31C5F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 