import { useEffect, useState, useCallback } from 'react'
import {
  speakMessageHandler,
  processAIResponse,
  handleSendChatFn,
} from '@/features/chat/handlers'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import { Message } from '@/features/messages/messages'

class ReceivedMessage {
  timestamp: number
  message: string
  type: 'direct_send' | 'ai_generate' | 'user_input'
  systemPrompt?: string
  useCurrentSystemPrompt?: boolean

  constructor(
    timestamp: number,
    message: string,
    type: 'direct_send' | 'ai_generate' | 'user_input',
    systemPrompt?: string,
    useCurrentSystemPrompt?: boolean
  ) {
    this.timestamp = timestamp
    this.message = message
    this.type = type
    this.systemPrompt = systemPrompt
    this.useCurrentSystemPrompt = useCurrentSystemPrompt
  }
}

const MessageReceiver = () => {
  const [lastTimestamp, setLastTimestamp] = useState(0)
  const clientId = settingsStore((state) => state.clientId)
  const handleSendChat = handleSendChatFn()

  const speakMessage = useCallback(
    async (messages: ReceivedMessage[]) => {
      const hs = homeStore.getState()
      const ss = settingsStore.getState()

      for (const message of messages) {
        switch (message.type) {
          case 'direct_send':
            await speakMessageHandler(message.message)
            break
          case 'ai_generate': {
            let capturedImage = ''
            const CAPTURE_TIMEOUT = 10000 // 10秒のタイムアウト

            try {
              // キャプチャをトリガー
              if (!hs.modalImage) {
                homeStore.setState({ triggerShutter: true })
              }

              // webcamStatusまたはcaptureStatusがtrueの場合、画像が取得されるまで待機
              if (hs.webcamStatus || hs.captureStatus) {
                // 画像が取得されるまで待つ
                capturedImage = await Promise.race([
                  new Promise<string>((resolve) => {
                    const checkImage = setInterval(() => {
                      const currentModalImage = homeStore.getState().modalImage
                      if (currentModalImage) {
                        clearInterval(checkImage)
                        resolve(currentModalImage)
                      }
                    }, 100)
                  }),
                  new Promise<string>((_, reject) =>
                    setTimeout(
                      () => reject(new Error('Image capture timeout')),
                      CAPTURE_TIMEOUT
                    )
                  ),
                ])
              } else {
                // 既存の modalImage があれば使用
                capturedImage = hs.modalImage || ''
              }
            } catch (error) {
              console.error('Failed to capture image:', error)
              // エラー時は画像なしで続行
              capturedImage = ''
            }

            const conversationHistory = [
              ...hs.chatLog.slice(-10),
              { role: 'user', content: message.message },
            ]
              .map((m) => `${m.role}: ${m.content}`)
              .join('\n')
            const systemPrompt = message.useCurrentSystemPrompt
              ? ss.systemPrompt
              : message.systemPrompt
            const messages: Message[] = [
              {
                role: 'system',
                content: systemPrompt?.replace(
                  '[conversation_history]',
                  conversationHistory
                ),
              },
              {
                role: 'user',
                content: capturedImage
                  ? [
                      { type: 'text', text: message.message },
                      { type: 'image', image: capturedImage },
                    ]
                  : message.message,
              },
            ]

            // 画像を使用した後にクリア
            if (capturedImage) {
              homeStore.setState({ modalImage: '' })
            }

            await processAIResponse(hs.chatLog, messages)
            break
          }
          case 'user_input': {
            let capturedImage = ''
            const CAPTURE_TIMEOUT = 10000 // 10秒のタイムアウト

            try {
              // キャプチャをトリガー
              if (!hs.modalImage) {
                homeStore.setState({ triggerShutter: true })
              }

              // webcamStatusまたはcaptureStatusがtrueの場合、画像が取得されるまで待機
              if (hs.webcamStatus || hs.captureStatus) {
                // 画像が取得されるまで待つ
                capturedImage = await Promise.race([
                  new Promise<string>((resolve) => {
                    const checkImage = setInterval(() => {
                      const currentModalImage = homeStore.getState().modalImage
                      if (currentModalImage) {
                        clearInterval(checkImage)
                        resolve(currentModalImage)
                      }
                    }, 100)
                  }),
                  new Promise<string>((_, reject) =>
                    setTimeout(
                      () => reject(new Error('Image capture timeout')),
                      CAPTURE_TIMEOUT
                    )
                  ),
                ])
              } else {
                // 既存の modalImage があれば使用
                capturedImage = hs.modalImage || ''
              }
            } catch (error) {
              console.error('Failed to capture image:', error)
              // エラー時は画像なしで続行
              capturedImage = ''
            }

            // handleSendChatFnを使用してメッセージを送信
            await handleSendChat(message.message)
            break
          }
          default:
            console.error('Invalid message type:', message.type)
        }
      }
    },
    [handleSendChat]
  )

  useEffect(() => {
    if (!clientId) return

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `/api/messages?lastTimestamp=${lastTimestamp}&clientId=${clientId}`
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (data.messages && data.messages.length > 0) {
          speakMessage(data.messages)
          const newLastTimestamp =
            data.messages[data.messages.length - 1].timestamp
          setLastTimestamp(newLastTimestamp)
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    fetchMessages()
    const intervalId = setInterval(fetchMessages, 1000)

    return () => clearInterval(intervalId)
  }, [clientId, lastTimestamp, speakMessage])

  return <></>
}

export default MessageReceiver
