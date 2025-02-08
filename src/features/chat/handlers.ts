import { getAIChatResponseStream } from '@/features/chat/aiChatFactory'
import { Message, EmotionType } from '@/features/messages/messages'
import { speakCharacter } from '@/features/messages/speakCharacter'
import { judgeSlide } from '@/features/slide/slideAIHelpers'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import slideStore from '@/features/stores/slide'
import { goToSlide } from '@/components/slides'
import { messageSelectors } from '../messages/messageSelectors'
import webSocketStore from '@/features/stores/websocketStore'
import i18next from 'i18next'
import toastStore from '@/features/stores/toast'

// セッションIDを生成する関数
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 受け取ったメッセージを処理し、AIの応答を生成して発話させる
 * @param receivedMessage 処理する文字列
 */
export const speakMessageHandler = async (receivedMessage: string) => {
  const sessionId = generateSessionId()
  const hs = homeStore.getState()
  const currentSlideMessages: string[] = []

  let isCodeBlock: boolean = false
  let codeBlockText: string = ''
  let logText: string = ''
  let assistantMessage: string[] = []
  let remainingMessage = receivedMessage
  let prevRemainingMessage: string = ''
  const addedChatLog: Message[] = []
  const delimiter = '```'

  while (remainingMessage.length > 0 || isCodeBlock) {
    let sentence = ''
    prevRemainingMessage = remainingMessage

    if (remainingMessage.includes(delimiter)) {
      // コードブロックの分割
      isCodeBlock = true
      const [first, ...rest] = remainingMessage.split(delimiter)
      ;[remainingMessage, codeBlockText] = [
        first,
        rest.join(delimiter).replace(/^\n/, ''),
      ]
    } else if (remainingMessage == '' && isCodeBlock) {
      // コードブロックの分割
      let code = ''
      const [first, ...rest] = codeBlockText.split(delimiter)
      ;[code, remainingMessage] = [first, rest.join(delimiter)]
      addedChatLog.push({
        role: 'assistant',
        content: logText,
      })
      addedChatLog.push({
        role: 'code',
        content: code,
      })

      codeBlockText = ''
      logText = ''
      isCodeBlock = false
    }

    // 返答内容の感情部分と返答部分を分離
    let emotion: string = ''
    const emotionMatch = remainingMessage.match(/^\[(.*?)\]/)
    if (emotionMatch?.[0]) {
      emotion = emotionMatch[0]
      remainingMessage = remainingMessage.slice(emotion.length)
    }

    const sentenceMatch = remainingMessage.match(
      /^(.{1,19}?(?:[。．.!?！？\n]|(?=\[))|.{20,}?(?:[、,。．.!?！？\n]|(?=\[)))/
    )
    if (sentenceMatch?.[0]) {
      sentence = sentenceMatch?.[0]
      // 区切った文字の残りでremainingMessageを更新
      remainingMessage = remainingMessage.slice(sentence.length).trimStart()
    }

    if (remainingMessage != '' && remainingMessage == prevRemainingMessage) {
      sentence = prevRemainingMessage
      remainingMessage = ''
    }

    // 発話不要/不可能な文字列だった場合はスキップ
    if (
      sentence == '' ||
      sentence.replace(
        /^[\s\u3000\t\n\r\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]'"''""・、。,.!?！？:：;；\-_=+~～*＊@＠#＃$＄%％^＾&＆|｜\\＼/／`｀]+$/gu,
        ''
      ) == ''
    ) {
      continue
    }

    // 区切った文字をassistantMessageに追加
    assistantMessage.push(sentence)
    // em感情と返答を結合（音声再生で使用される）
    let aiText = emotion ? `${emotion} ${sentence}` : sentence
    logText = logText + ' ' + aiText

    speakCharacter(
      sessionId,
      {
        message: sentence,
        emotion: emotion.includes('[')
          ? (emotion.slice(1, -1) as EmotionType)
          : 'neutral',
      },
      () => {
        homeStore.setState({
          assistantMessage: assistantMessage.join(' '),
        })
        hs.incrementChatProcessingCount()
        // スライド用のメッセージを更新
        currentSlideMessages.push(sentence)
      },
      () => {
        hs.decrementChatProcessingCount()
        currentSlideMessages.shift()
        homeStore.setState({
          slideMessages: currentSlideMessages,
        })
      }
    )
  } // while loop end

  addedChatLog.push({
    role: 'assistant',
    content: logText,
  })
  homeStore.setState({
    slideMessages: currentSlideMessages,
    chatLog: [...hs.chatLog, ...addedChatLog],
  })
}

/**
 * AIからの応答を処理する関数
 * @param currentChatLog ログに残るメッセージの配列
 * @param messages 解答生成に使用するメッセージの配列
 */
// TODO: 上の関数とかなり処理が被るのでいずれまとめる
export const processAIResponse = async (
  currentChatLog: Message[],
  messages: Message[]
) => {
  const sessionId = generateSessionId()
  homeStore.setState({ chatProcessing: true })
  let stream

  const hs = homeStore.getState()
  const currentSlideMessages: string[] = []

  try {
    stream = await getAIChatResponseStream(messages)
  } catch (e) {
    console.error(e)
    stream = null
  }

  if (stream == null) {
    homeStore.setState({ chatProcessing: false })
    return
  }

  const reader = stream.getReader()
  let receivedMessage = ''
  let aiTextLog: Message[] = [] // 会話ログ欄で使用
  let emotion = ''
  let isCodeBlock = false
  let codeBlockText = ''
  const sentences = new Array<string>() // AssistantMessage欄で使用

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done && receivedMessage.length === 0) break

      if (value) receivedMessage += value

      // 返答を一文単位で切り出して処理する
      while (receivedMessage.length > 0) {
        if (isCodeBlock) {
          if (receivedMessage.includes('```')) {
            // コードブロックの終了処理
            const [codeEnd, ...restOfSentence] = receivedMessage.split('```')
            aiTextLog.push({
              role: 'code',
              content: codeBlockText + codeEnd,
            })

            receivedMessage = restOfSentence.join('```').trimStart()
            codeBlockText = ''
            isCodeBlock = false
            continue
          } else {
            // コードブロック中だが終了マークがまだない
            codeBlockText += receivedMessage
            receivedMessage = ''
            continue
          }
        }

        if (receivedMessage.includes('```')) {
          // コードブロックの開始処理
          const [beforeCode, ...rest] = receivedMessage.split('```')

          // コードブロック前のテキストを処理
          if (beforeCode.trim()) {
            receivedMessage = beforeCode
            isCodeBlock = true
            codeBlockText = rest.join('```')
          } else {
            isCodeBlock = true
            codeBlockText = rest.join('```')
            receivedMessage = ''
            continue
          }
        }

        // 先頭の改行を削除
        receivedMessage = receivedMessage.trimStart()

        // 返答内容の感情部分と返答部分を分離
        const emotionMatch = receivedMessage.match(/^\[(.*?)\]/)
        if (emotionMatch && emotionMatch[0]) {
          emotion = emotionMatch[0]
          receivedMessage = receivedMessage.slice(emotion.length)
        }

        const sentenceMatch = receivedMessage.match(
          /^(.{1,19}?(?:[。．.!?！？\n]|(?=\[))|.{20,}?(?:[、,。．.!?！？\n]|(?=\[)))/
        )
        if (sentenceMatch?.[0]) {
          let sentence = sentenceMatch[0]
          // 区切った文字をsentencesに追加
          sentences.push(sentence)
          // 区切った文字の残りでreceivedMessageを更新
          receivedMessage = receivedMessage.slice(sentence.length).trimStart()

          // 発話不要/不可能な文字列だった場合はスキップ
          if (
            !sentence.includes('```') &&
            !sentence.replace(
              /^[\s\u3000\t\n\r\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]'"''""・、。,.!?！？:：;；\-_=+~～*＊@＠#＃$＄%％^＾&＆|｜\\＼/／`｀]+$/gu,
              ''
            )
          ) {
            continue
          }

          // 感情と返答を結合（音声再生で使用される）
          let aiText = `${emotion} ${sentence}`
          aiTextLog.push({ role: 'assistant', content: aiText })

          // 文ごとに音声を生成 & 再生、返答を表示
          const currentAssistantMessage = sentences.join(' ')

          speakCharacter(
            sessionId,
            {
              message: sentence,
              emotion: emotion.includes('[')
                ? (emotion.slice(1, -1) as EmotionType)
                : 'neutral',
            },
            () => {
              homeStore.setState({
                assistantMessage: currentAssistantMessage,
              })
              hs.incrementChatProcessingCount()
              // スライド用のメッセージを更新
              currentSlideMessages.push(sentence)
              homeStore.setState({
                slideMessages: currentSlideMessages,
              })
            },
            () => {
              hs.decrementChatProcessingCount()
              currentSlideMessages.shift()
              homeStore.setState({
                slideMessages: currentSlideMessages,
              })
            }
          )
        } else {
          // マッチする文がない場合、ループを抜ける
          break
        }
      }

      // ストリームが終了し、receivedMessageが空でない場合の処理
      if (done && receivedMessage.length > 0) {
        // 残りのメッセージを処理
        let aiText = `${emotion} ${receivedMessage}`
        aiTextLog.push({ role: 'assistant', content: aiText })
        sentences.push(receivedMessage)

        const currentAssistantMessage = sentences.join(' ')

        speakCharacter(
          sessionId,
          {
            message: receivedMessage,
            emotion: emotion.includes('[')
              ? (emotion.slice(1, -1) as EmotionType)
              : 'neutral',
          },
          () => {
            homeStore.setState({
              assistantMessage: currentAssistantMessage,
            })
            hs.incrementChatProcessingCount()
            // スライド用のメッセージを更新
            currentSlideMessages.push(receivedMessage)
            homeStore.setState({
              slideMessages: currentSlideMessages,
            })
          },
          () => {
            hs.decrementChatProcessingCount()
            currentSlideMessages.shift()
            homeStore.setState({
              slideMessages: currentSlideMessages,
            })
          }
        )

        receivedMessage = ''
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    reader.releaseLock()
  }

  aiTextLog = messageSelectors.normalizeMessages(aiTextLog)

  homeStore.setState({
    chatLog: [...currentChatLog, ...aiTextLog],
    chatProcessing: false,
  })
}

/**
 * アシスタントとの会話を行う
 * 画面のチャット欄から入力されたときに実行される処理
 * Youtubeでチャット取得した場合もこの関数を使用する
 */
export const handleSendChatFn = () => async (text: string) => {
  const sessionId = generateSessionId()
  const newMessage = text
  const timestamp = new Date().toISOString()

  if (newMessage === null) return

  const ss = settingsStore.getState()
  const hs = homeStore.getState()
  const sls = slideStore.getState()
  const wsManager = webSocketStore.getState().wsManager

  if (ss.externalLinkageMode) {
    homeStore.setState({ chatProcessing: true })

    if (wsManager?.websocket?.readyState === WebSocket.OPEN) {
      // ユーザーの発言を追加して表示
      const updateLog: Message[] = [
        ...hs.chatLog,
        { role: 'user', content: newMessage, timestamp: timestamp },
      ]
      homeStore.setState({
        chatLog: updateLog,
      })

      // WebSocket送信
      wsManager.websocket.send(
        JSON.stringify({ content: newMessage, type: 'chat' })
      )
    } else {
      toastStore.getState().addToast({
        message: i18next.t('NotConnectedToExternalAssistant'),
        type: 'error',
        tag: 'not-connected-to-external-assistant',
      })
      homeStore.setState({
        chatProcessing: false,
      })
    }
  } else if (ss.realtimeAPIMode) {
    if (wsManager?.websocket?.readyState === WebSocket.OPEN) {
      // ユーザーの発言を追加して表示
      const updateLog: Message[] = [
        ...hs.chatLog,
        { role: 'user', content: newMessage, timestamp: timestamp },
      ]
      homeStore.setState({
        chatLog: updateLog,
      })
    }
  } else {
    let systemPrompt = ss.systemPrompt
    if (ss.slideMode) {
      if (sls.isPlaying) {
        return
      }

      try {
        let scripts = JSON.stringify(
          require(
            `../../../public/slides/${sls.selectedSlideDocs}/scripts.json`
          )
        )
        systemPrompt = systemPrompt.replace('{{SCRIPTS}}', scripts)

        let supplement = ''
        try {
          const response = await fetch(
            `/api/getSupplement?slideDocs=${sls.selectedSlideDocs}`
          )
          if (!response.ok) {
            throw new Error('Failed to fetch supplement')
          }
          const data = await response.json()
          supplement = data.supplement
          systemPrompt = systemPrompt.replace('{{SUPPLEMENT}}', supplement)
        } catch (e) {
          console.error('supplement.txtの読み込みに失敗しました:', e)
        }

        const answerString = await judgeSlide(newMessage, scripts, supplement)
        const answer = JSON.parse(answerString)
        if (answer.judge === 'true' && answer.page !== '') {
          goToSlide(Number(answer.page))
          systemPrompt += `\n\nEspecial Page Number is ${answer.page}.`
        }
      } catch (e) {
        console.error(e)
      }
    }

    homeStore.setState({ chatProcessing: true })
    // ユーザーの発言を追加して表示
    const messageLog: Message[] = [
      ...hs.chatLog,
      {
        role: 'user',
        content: hs.modalImage
          ? [
              { type: 'text', text: newMessage },
              { type: 'image', image: hs.modalImage },
            ]
          : newMessage,
        timestamp: timestamp,
      },
    ]
    if (hs.modalImage) {
      homeStore.setState({ modalImage: '' })
    }
    homeStore.setState({ chatLog: messageLog })

    const messages: Message[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messageSelectors.getProcessedMessages(
        messageLog,
        ss.includeTimestampInUserMessage
      ),
    ]

    try {
      await processAIResponse(messageLog, messages)
    } catch (e) {
      console.error(e)
    }

    homeStore.setState({ chatProcessing: false })
  }
}

/**
 * WebSocketからのテキストを受信したときの処理
 */
export const handleReceiveTextFromWsFn =
  () =>
  async (
    text: string,
    role?: string,
    emotion: EmotionType = 'neutral',
    type?: string
  ) => {
    const sessionId = generateSessionId()
    if (text === null || role === undefined) return

    const ss = settingsStore.getState()
    const hs = homeStore.getState()
    const wsManager = webSocketStore.getState().wsManager

    if (ss.externalLinkageMode) {
      console.log('ExternalLinkage Mode: true')
    } else {
      console.log('ExternalLinkage Mode: false')
      return
    }

    homeStore.setState({ chatProcessing: true })

    if (role !== 'user') {
      const updateLog: Message[] = [...hs.chatLog]

      if (type === 'start') {
        // startの場合は何もしない（textは空文字のため）
        console.log('Starting new response')
        wsManager?.setTextBlockStarted(false)
      } else if (
        updateLog.length > 0 &&
        updateLog[updateLog.length - 1].role === role &&
        wsManager?.textBlockStarted
      ) {
        // 既存のメッセージに追加
        updateLog[updateLog.length - 1].content += text
      } else {
        // 新しいメッセージを追加
        updateLog.push({ role: role, content: text })
        wsManager?.setTextBlockStarted(true)
      }

      if (role === 'assistant' && text !== '') {
        let aiText = `[${emotion}] ${text}`
        try {
          // 文ごとに音声を生成 & 再生、返答を表示
          speakCharacter(
            sessionId,
            {
              message: text,
              emotion: emotion,
            },
            () => {
              homeStore.setState({
                chatLog: updateLog,
                assistantMessage: (() => {
                  const content = updateLog[updateLog.length - 1].content
                  return typeof content === 'string' ? content : ''
                })(),
              })
            },
            () => {
              // hs.decrementChatProcessingCount()
            }
          )
        } catch (e) {
          console.error('Error in speakCharacter:', e)
        }
      } else {
        homeStore.setState({
          chatLog: updateLog,
        })
      }

      if (type === 'end') {
        // レスポンスの終了処理
        console.log('Response ended')
        wsManager?.setTextBlockStarted(false)
        homeStore.setState({ chatProcessing: false })
      }
    }

    homeStore.setState({ chatProcessing: type !== 'end' })
  }

/**
 * RealtimeAPIからのテキストまたは音声データを受信したときの処理
 */
export const handleReceiveTextFromRtFn =
  () =>
  async (text?: string, role?: string, type?: string, buffer?: ArrayBuffer) => {
    const sessionId = generateSessionId()
    if ((!text && !buffer) || role === undefined) return

    const ss = settingsStore.getState()
    const hs = homeStore.getState()

    if (ss.realtimeAPIMode) {
      console.log('realtime api mode: true')
    } else if (ss.audioMode) {
      console.log('audio mode: true')
    } else {
      console.log('realtime api mode: false')
      return
    }

    homeStore.setState({ chatProcessing: true })

    if (role == 'assistant') {
      const updateLog: Message[] = [...hs.chatLog]

      if (type?.includes('response.audio') && buffer !== undefined) {
        console.log('response.audio:')
        try {
          speakCharacter(
            sessionId,
            {
              emotion: 'neutral',
              message: '',
              buffer: buffer,
            },
            () => {},
            () => {}
          )
        } catch (e) {
          console.error('Error in speakCharacter:', e)
        }
      } else if (type === 'response.content_part.done' && text !== undefined) {
        updateLog.push({ role: role, content: text })
        homeStore.setState({
          chatLog: updateLog,
        })
      }
    }
    homeStore.setState({ chatProcessing: false })
  }
