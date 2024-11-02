import { getAIChatResponseStream } from '@/features/chat/aiChatFactory'
import { textsToScreenplay, Message } from '@/features/messages/messages'
import { speakCharacter } from '@/features/messages/speakCharacter'
import { judgeSlide } from '@/features/slide/slideAIHelpers'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import slideStore from '@/features/stores/slide'
import { goToSlide } from '@/components/slides'
import { messageSelectors } from '../messages/messageSelectors'
import webSocketStore from '@/features/stores/websocketStore'

/**
 * 受け取ったメッセージを処理し、AIの応答を生成して発話させる
 * @param receivedMessage 処理する文字列
 */
export const speakMessageHandler = async (receivedMessage: string) => {
  const ss = settingsStore.getState()
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

    // 返答内容のタグ部分と返答部分を分離
    let tag: string = ''
    const tagMatch = remainingMessage.match(/^\[(.*?)\]/)
    if (tagMatch?.[0]) {
      tag = tagMatch[0]
      remainingMessage = remainingMessage.slice(tag.length)
    }

    const sentenceMatch = remainingMessage.match(
      /^(.{1,19}?[。．.!?！？\n]|.{20,}?[、,])/
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
    // タグと返答を結合（音声再生で使用される）
    let aiText = tag ? `${tag} ${sentence}` : sentence

    const aiTalks = textsToScreenplay([aiText], ss.koeiroParam) // TODO
    logText = logText + ' ' + sentence

    speakCharacter(
      aiTalks[0],
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
  homeStore.setState({ chatProcessing: true })
  let stream

  const ss = settingsStore.getState()
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
  let tag = ''
  let isCodeBlock = false
  let codeBlockText = ''
  const sentences = new Array<string>() // AssistantMessage欄で使用
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done && receivedMessage.length === 0) break

      if (value) receivedMessage += value

      // 返答内容のタグ部分と返答部分を分離
      const tagMatch = receivedMessage.match(/^\[(.*?)\]/)
      if (tagMatch && tagMatch[0]) {
        tag = tagMatch[0]
        receivedMessage = receivedMessage.slice(tag.length)
      }

      // 返答を一文単位で切り出して処理する
      while (receivedMessage.length > 0) {
        const sentenceMatch = receivedMessage.match(
          /^(.+?[。．.!?！？\n]|.{20,}[、,])/
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

          // タグと返答を結合（音声再生で使用される）
          let aiText = `${tag} ${sentence}`
          console.log('aiText', aiText)

          if (isCodeBlock && !sentence.includes('```')) {
            codeBlockText += sentence
            continue
          }

          if (sentence.includes('```')) {
            if (isCodeBlock) {
              // コードブロックの終了処理
              const [codeEnd, ...restOfSentence] = sentence.split('```')
              aiTextLog.push({
                role: 'code',
                content: codeBlockText + codeEnd,
              })
              aiText += `${tag} ${restOfSentence.join('```') || ''}`

              // AssistantMessage欄の更新
              homeStore.setState({ assistantMessage: sentences.join(' ') })

              codeBlockText = ''
              isCodeBlock = false
            } else {
              // コードブロックの開始処理
              isCodeBlock = true
              ;[aiText, codeBlockText] = aiText.split('```')
            }

            sentence = sentence.replace(/```/g, '')
          }

          const aiTalks = textsToScreenplay([aiText], ss.koeiroParam)
          aiTextLog.push({ role: 'assistant', content: sentence })

          // 文ごとに音声を生成 & 再生、返答を表示
          const currentAssistantMessage = sentences.join(' ')

          speakCharacter(
            aiTalks[0],
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
        let aiText = `${tag} ${receivedMessage}`
        const aiTalks = textsToScreenplay([aiText], ss.koeiroParam)
        aiTextLog.push({ role: 'assistant', content: receivedMessage })
        sentences.push(receivedMessage)

        const currentAssistantMessage = sentences.join(' ')

        speakCharacter(
          aiTalks[0],
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

  aiTextLog = messageSelectors.getProcessedMessages(aiTextLog)

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
export const handleSendChatFn =
  (errors: {
    NotConnectedToExternalAssistant: string
    APIKeyNotEntered: string
  }) =>
  async (text: string) => {
    const newMessage = text

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
          { role: 'user', content: newMessage },
        ]
        homeStore.setState({
          chatLog: updateLog,
        })

        // WebSocket送信
        wsManager.websocket.send(
          JSON.stringify({ content: newMessage, type: 'chat' })
        )
      } else {
        homeStore.setState({
          assistantMessage: errors['NotConnectedToExternalAssistant'],
          chatProcessing: false,
        })
      }
    } else if (ss.realtimeAPIMode) {
      if (wsManager?.websocket?.readyState === WebSocket.OPEN) {
        // ユーザーの発言を追加して表示
        const updateLog: Message[] = [
          ...hs.chatLog,
          { role: 'user', content: newMessage },
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
        ...messageSelectors.getProcessedMessages(messageLog),
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
    emotion: string = 'neutral',
    type?: string
  ) => {
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
      } else if (
        updateLog.length > 0 &&
        updateLog[updateLog.length - 1].role === role &&
        wsManager?.streaming
      ) {
        // 既存のメッセージに追加
        updateLog[updateLog.length - 1].content += text
      } else {
        // 新しいメッセージを追加
        updateLog.push({ role: role, content: text })
      }

      if (role === 'assistant' && text !== '') {
        let aiText = `[${emotion}] ${text}`
        try {
          const aiTalks = textsToScreenplay([aiText], ss.koeiroParam)

          // 文ごとに音声を生成 & 再生、返答を表示
          speakCharacter(
            aiTalks[0],
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
            {
              expression: 'neutral',
              talk: {
                style: 'talk',
                speakerX: 0,
                speakerY: 0,
                message: '',
                buffer: buffer,
              },
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
