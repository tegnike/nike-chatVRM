import { Message } from '../messages/messages'
import i18next from 'i18next'
import settingsStore, {
  multiModalAIServiceKey,
  multiModalAIServices,
} from '@/features/stores/settings'

const getAIConfig = () => {
  const ss = settingsStore.getState()
  const aiService = ss.selectAIService as multiModalAIServiceKey

  if (!multiModalAIServices.includes(aiService)) {
    throw new Error('Invalid AI service')
  }

  const apiKeyName = `${aiService}Key` as const
  const apiKey = ss[apiKeyName]

  return {
    aiApiKey: apiKey,
    selectAIService: aiService,
    selectAIModel: ss.selectAIModel,
    azureEndpoint: ss.azureEndpoint,
  }
}

function handleApiError(errorCode: string): string {
  const languageCode = settingsStore.getState().selectLanguage
  i18next.changeLanguage(languageCode)
  return i18next.t(`Errors.${errorCode || 'AIAPIError'}`)
}

async function callAIChat(
  messages: Message[],
  stream: boolean,
  toolRequired: boolean = true
) {
  const { aiApiKey, selectAIService, selectAIModel, azureEndpoint } =
    getAIConfig()

  return await fetch('/api/aiChat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      apiKey: aiApiKey,
      aiService: selectAIService,
      model: selectAIModel,
      azureEndpoint: azureEndpoint,
      stream,
      toolRequired,
    }),
  })
}

export async function getVercelAIChatResponse(messages: Message[]) {
  const { aiApiKey, selectAIService, selectAIModel, azureEndpoint } =
    getAIConfig()

  try {
    const response = await callAIChat(messages, false)

    if (!response.ok) {
      const responseBody = await response.json()
      throw new Error(
        `API request to ${selectAIService} failed with status ${response.status} and body ${responseBody.error}`,
        { cause: { errorCode: responseBody.errorCode } }
      )
    }

    const data = await response.json()
    return { text: data.text }
  } catch (error: any) {
    console.error(`Error fetching ${selectAIService} API response:`, error)
    const errorCode = error.cause?.errorCode || 'AIAPIError'
    return { text: handleApiError(errorCode) }
  }
}

export async function getVercelAIChatResponseStream(
  messages: Message[]
): Promise<ReadableStream<string>> {
  const { selectAIService } = getAIConfig()

  async function processResponse(
    response: Response,
    controller: ReadableStreamDefaultController<string>,
    currentMessages: Message[]
  ) {
    if (!response.ok) {
      const responseBody = await response.json()
      throw new Error(
        `API request to ${selectAIService} failed with status ${
          response.status
        } and body ${responseBody.error}`,
        { cause: { errorCode: responseBody.errorCode } }
      )
    }

    if (!response.body) {
      throw new Error(
        `API response from ${selectAIService} is empty, status ${response.status}`,
        { cause: { errorCode: 'AIAPIError' } }
      )
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          console.log('pass here:', line)
          if (line.startsWith('0:')) {
            const content = line.substring(2).trim()
            const decodedContent = JSON.parse(content)
            controller.enqueue(decodedContent)
          } else if (line.startsWith('9:')) {
            controller.enqueue('[neutral]少々お待ちください。')
          } else if (line.startsWith('a:')) {
            const content = line.substring(2).trim()
            const decodedContent = JSON.parse(content)['result']

            const newMessages = [
              ...currentMessages,
              {
                role: 'user',
                content: `次の情報を参考に答えてください。\n${decodedContent}`,
              },
            ]

            const newResponse = await callAIChat(newMessages, true, false)
            await processResponse(newResponse, controller, newMessages)
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching ${selectAIService} API response:`, error)
      const errorMessage = handleApiError('AIAPIError')
      controller.enqueue(errorMessage)
    } finally {
      reader.releaseLock()
    }
  }

  try {
    return new ReadableStream({
      async start(controller) {
        const response = await callAIChat(messages, true)
        await processResponse(response, controller, messages)
        controller.close()
      },
    })
  } catch (error: any) {
    const errorMessage = handleApiError(error.cause?.errorCode || 'AIAPIError')
    return new ReadableStream({
      start(controller) {
        controller.enqueue(errorMessage)
        controller.close()
      },
    })
  }
}
