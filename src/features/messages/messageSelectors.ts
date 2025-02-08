import { Message } from './messages'
import settingsStore from '@/features/stores/settings'

export const messageSelectors = {
  // テキストまたは画像を含むメッセージのみを取得
  getTextAndImageMessages: (messages: Message[]): Message[] => {
    return messages.filter((message): boolean => {
      if (!message.content) return false
      return (
        typeof message.content === 'string' || Array.isArray(message.content)
      )
    })
  },

  // 音声メッセージのみを取得
  getAudioMessages: (messages: Message[]): Message[] => {
    return messages.filter((message) => {
      if (message.role === 'system') {
        return message.content
      }
      // userの場合：contentがstring型のメッセージのみを許可
      if (message.role === 'user') {
        return typeof message.content === 'string'
      }
      // assistantの場合：audioプロパティを持つメッセージのみを許可
      if (message.role === 'assistant') {
        return message.audio !== undefined
      }
      // その他のroleは除外
      return false
    })
  },

  // メッセージを処理して、テキストメッセージのみを取得
  getProcessedMessages: (
    messages: Message[],
    includeTimestamp: boolean
  ): Message[] => {
    const maxPastMessages = settingsStore.getState().maxPastMessages
    return messages
      .map((message, index) => {
        // 最後のメッセージだけそのまま利用する（= 最後のメッセージだけマルチモーダルの対象となる）
        const isLastMessage = index === messages.length - 1
        const messageText = Array.isArray(message.content)
          ? message.content[0].text
          : message.content || ''

        let content: Message['content']
        if (includeTimestamp) {
          content = message.timestamp
            ? `[${message.timestamp}] ${messageText}`
            : messageText
          if (isLastMessage && Array.isArray(message.content)) {
            content = [
              { type: 'text', text: content },
              { type: 'image', image: message.content[1].image },
            ]
          }
        } else {
          content = isLastMessage ? message.content : messageText
        }

        return {
          role: ['assistant', 'user', 'system'].includes(message.role)
            ? message.role
            : 'assistant',
          content,
        }
      })
      .slice(-maxPastMessages)
  },

  normalizeMessages: (messages: Message[]): Message[] => {
    let lastImageUrl = ''
    return messages
      .reduce((acc: Message[], item: Message) => {
        if (
          item.content &&
          typeof item.content != 'string' &&
          item.content[0] &&
          item.content[1]
        ) {
          lastImageUrl = item.content[1].image
        }

        const lastItem = acc[acc.length - 1]
        if (lastItem && lastItem.role === item.role) {
          if (typeof item.content != 'string' && item.content) {
            lastItem.content += ' ' + item.content[0].text
          } else {
            lastItem.content += ' ' + item.content
          }
        } else {
          const text = item.content
            ? typeof item.content != 'string'
              ? item.content[0].text
              : item.content
            : ''
          if (lastImageUrl != '') {
            acc.push({
              ...item,
              content: [
                { type: 'text', text: text.trim() },
                { type: 'image', image: lastImageUrl },
              ],
            })
            lastImageUrl = ''
          } else {
            acc.push({ ...item, content: text.trim() })
          }
        }
        return acc
      }, [])
      .filter((item) => item.content !== '')
  },

  // 画像メッセージをテキストメッセージに変換
  cutImageMessage: (messages: Message[]): Message[] => {
    return messages.map((message: Message) => ({
      ...message,
      content:
        message.content === undefined
          ? ''
          : typeof message.content === 'string'
            ? message.content
            : message.content[0].text,
    }))
  },

  // APIで保存する際のメッセージ処理
  sanitizeMessageForStorage: (message: Message): any => {
    if (message.audio !== undefined) {
      return {
        ...message,
        audio: '[audio data omitted]',
      }
    }

    if (message.content && Array.isArray(message.content)) {
      return {
        ...message,
        content: message.content.map((content: any) => {
          if (content.type === 'image') {
            return {
              type: 'image',
              image: '[image data omitted]',
            }
          }
          return content
        }),
      }
    }
    return message
  },
}
