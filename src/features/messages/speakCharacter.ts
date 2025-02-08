import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import englishToJapanese from '@/utils/englishToJapanese.json'
import { wait } from '@/utils/wait'
import { Talk } from './messages'
import { synthesizeStyleBertVITS2Api } from './synthesizeStyleBertVITS2'
import { synthesizeVoiceKoeiromapApi } from './synthesizeVoiceKoeiromap'
import { synthesizeVoiceElevenlabsApi } from './synthesizeVoiceElevenlabs'
import { synthesizeVoiceGoogleApi } from './synthesizeVoiceGoogle'
import { synthesizeVoiceVoicevoxApi } from './synthesizeVoiceVoicevox'
import { synthesizeVoiceAivisSpeechApi } from './synthesizeVoiceAivisSpeech'
import { synthesizeVoiceGSVIApi } from './synthesizeVoiceGSVI'
import { synthesizeVoiceOpenAIApi } from './synthesizeVoiceOpenAI'
import { synthesizeVoiceAzureOpenAIApi } from './synthesizeVoiceAzureOpenAI'
import toastStore from '@/features/stores/toast'
import i18next from 'i18next'
import { SpeakQueue } from './speakQueue'
import { synthesizeVoiceNijivoiceApi } from './synthesizeVoiceNijivoice'
import { Live2DHandler } from './live2dHandler'

interface EnglishToJapanese {
  [key: string]: string
}

const typedEnglishToJapanese = englishToJapanese as EnglishToJapanese

const speakQueue = new SpeakQueue()

function preprocessMessage(
  message: string,
  settings: ReturnType<typeof settingsStore.getState>
): string | null {
  // 前後の空白を削除
  let processed = message.trim()

  // 英語から日本語への変換
  if (settings.changeEnglishToJapanese && settings.selectLanguage === 'ja') {
    processed = convertEnglishToJapaneseReading(processed)
  }

  // 絵文字を削除
  processed = processed.replace(
    /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]/gu,
    ''
  )

  // 空文字列の場合はnullを返す
  return processed || null
}

const createSpeakCharacter = () => {
  let lastTime = 0
  let prevFetchPromise: Promise<unknown> = Promise.resolve()

  return (
    sessionId: string,
    talk: Talk,
    onStart?: () => void,
    onComplete?: () => void
  ) => {
    const ss = settingsStore.getState()
    onStart?.()

    speakQueue.checkSessionId(sessionId)

    const processedMessage = preprocessMessage(talk.message, ss)
    if (!processedMessage && !talk.buffer) {
      return
    }

    if (processedMessage) {
      talk.message = processedMessage
    }

    let isNeedDecode = true

    const fetchPromise = prevFetchPromise.then(async () => {
      const now = Date.now()
      if (now - lastTime < 1000) {
        await wait(1000 - (now - lastTime))
      }

      let buffer
      try {
        if (talk.message == '' && talk.buffer) {
          buffer = talk.buffer
          isNeedDecode = false
        } else if (ss.audioMode) {
          buffer = null
        } else if (ss.selectVoice == 'koeiromap') {
          buffer = await synthesizeVoiceKoeiromapApi(
            talk,
            ss.koeiromapKey,
            ss.koeiroParam
          )
        } else if (ss.selectVoice == 'voicevox') {
          buffer = await synthesizeVoiceVoicevoxApi(
            talk,
            ss.voicevoxSpeaker,
            ss.voicevoxSpeed,
            ss.voicevoxPitch,
            ss.voicevoxIntonation,
            ss.voicevoxServerUrl
          )
        } else if (ss.selectVoice == 'google') {
          buffer = await synthesizeVoiceGoogleApi(
            talk,
            ss.googleTtsType,
            ss.selectLanguage
          )
        } else if (ss.selectVoice == 'stylebertvits2') {
          buffer = await synthesizeStyleBertVITS2Api(
            talk,
            ss.stylebertvits2ServerUrl,
            ss.stylebertvits2ApiKey,
            ss.stylebertvits2ModelId,
            ss.stylebertvits2Style,
            ss.stylebertvits2SdpRatio,
            ss.stylebertvits2Length,
            ss.selectLanguage
          )
        } else if (ss.selectVoice == 'aivis_speech') {
          buffer = await synthesizeVoiceAivisSpeechApi(
            talk,
            ss.aivisSpeechSpeaker,
            ss.aivisSpeechSpeed,
            ss.aivisSpeechPitch,
            ss.aivisSpeechIntonation,
            ss.aivisSpeechServerUrl
          )
        } else if (ss.selectVoice == 'gsvitts') {
          buffer = await synthesizeVoiceGSVIApi(
            talk,
            ss.gsviTtsServerUrl,
            ss.gsviTtsModelId,
            ss.gsviTtsBatchSize,
            ss.gsviTtsSpeechRate
          )
        } else if (ss.selectVoice == 'elevenlabs') {
          buffer = await synthesizeVoiceElevenlabsApi(
            talk,
            ss.elevenlabsApiKey,
            ss.elevenlabsVoiceId,
            ss.selectLanguage
          )
        } else if (ss.selectVoice == 'openai') {
          buffer = await synthesizeVoiceOpenAIApi(
            talk,
            ss.openaiTTSKey || ss.openaiKey,
            ss.openaiTTSVoice,
            ss.openaiTTSModel,
            ss.openaiTTSSpeed
          )
        } else if (ss.selectVoice == 'azure') {
          buffer = await synthesizeVoiceAzureOpenAIApi(
            talk,
            ss.azureTTSKey || ss.azureKey,
            ss.azureTTSEndpoint || ss.azureEndpoint,
            ss.openaiTTSVoice,
            ss.openaiTTSSpeed
          )
        } else if (ss.selectVoice == 'nijivoice') {
          buffer = await synthesizeVoiceNijivoiceApi(
            talk,
            ss.nijivoiceApiKey,
            ss.nijivoiceActorId,
            ss.nijivoiceSpeed,
            ss.nijivoiceEmotionalLevel,
            ss.nijivoiceSoundDuration
          )
        }
      } catch (error) {
        handleTTSError(error, ss.selectVoice)
        return null
      }
      lastTime = Date.now()
      return buffer
    })

    prevFetchPromise = fetchPromise

    // キューを使用した処理に変更
    fetchPromise.then((audioBuffer) => {
      if (!audioBuffer) return

      speakQueue.addTask({
        audioBuffer,
        talk,
        isNeedDecode,
        onComplete,
      })
    })
  }
}

function convertEnglishToJapaneseReading(text: string): string {
  const sortedKeys = Object.keys(typedEnglishToJapanese).sort(
    (a, b) => b.length - a.length
  )

  return sortedKeys.reduce((result, englishWord) => {
    const japaneseReading = typedEnglishToJapanese[englishWord]
    const regex = new RegExp(`\\b${englishWord}\\b`, 'gi')
    return result.replace(regex, japaneseReading)
  }, text)
}

function handleTTSError(error: unknown, serviceName: string): void {
  let message: string
  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  } else {
    message = i18next.t('Errors.UnexpectedError')
  }
  const errorMessage = i18next.t('Errors.TTSServiceError', {
    serviceName,
    message,
  })

  toastStore.getState().addToast({
    message: errorMessage,
    type: 'error',
    duration: 5000,
    tag: 'tts-error',
  })

  console.error(errorMessage)
}

export const speakCharacter = createSpeakCharacter()

export const testVoiceVox = async () => {
  const ss = settingsStore.getState()
  const talk: Talk = {
    message: 'ボイスボックスを使用します',
    emotion: 'neutral',
  }
  const buffer = await synthesizeVoiceVoicevoxApi(
    talk,
    ss.voicevoxSpeaker,
    ss.voicevoxSpeed,
    ss.voicevoxPitch,
    ss.voicevoxIntonation,
    ss.voicevoxServerUrl
  ).catch(() => null)
  if (buffer) {
    const ss = settingsStore.getState()
    if (ss.modelType === 'vrm') {
      const hs = homeStore.getState()
      await hs.viewer.model?.speak(buffer, talk)
    } else if (ss.modelType === 'live2d') {
      Live2DHandler.speak(buffer, talk)
    }
  }
}

export const testAivisSpeech = async () => {
  const ss = settingsStore.getState()
  const talk: Talk = {
    message: 'AivisSpeechを使用します',
    emotion: 'neutral',
  }
  const buffer = await synthesizeVoiceAivisSpeechApi(
    talk,
    ss.aivisSpeechSpeaker,
    ss.aivisSpeechSpeed,
    ss.aivisSpeechPitch,
    ss.aivisSpeechIntonation,
    ss.aivisSpeechServerUrl
  ).catch(() => null)
  if (buffer) {
    const ss = settingsStore.getState()
    if (ss.modelType === 'vrm') {
      const hs = homeStore.getState()
      await hs.viewer.model?.speak(buffer, talk)
    } else if (ss.modelType === 'live2d') {
      Live2DHandler.speak(buffer, talk)
    }
  }
}
