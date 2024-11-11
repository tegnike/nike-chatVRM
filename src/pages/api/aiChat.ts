import { Message } from '@/features/messages/messages'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createCohere } from '@ai-sdk/cohere'
import { createMistral } from '@ai-sdk/mistral'
import { createAzure } from '@ai-sdk/azure'
import { streamText, generateText, CoreMessage, CoreTool } from 'ai'
import { NextRequest } from 'next/server'

import { createAISDKTools } from '@agentic/ai-sdk'
import { WeatherClient } from '@agentic/weather'
import { TavilyClient } from '@agentic/tavily'

type AIServiceKey =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure'
  | 'groq'
  | 'cohere'
  | 'mistralai'
  | 'perplexity'
  | 'fireworks'
type AIServiceConfig = Record<AIServiceKey, () => any>

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method Not Allowed',
        errorCode: 'METHOD_NOT_ALLOWED',
      }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const {
    messages,
    apiKey,
    aiService,
    model,
    azureEndpoint,
    stream,
    toolRequired,
  } = await req.json()

  let aiApiKey = apiKey
  if (!aiApiKey) {
    const envKey = `${aiService.toUpperCase()}_KEY` as keyof typeof process.env
    const envApiKey = process.env[envKey]

    aiApiKey = envApiKey
  }

  if (!aiApiKey) {
    return new Response(
      JSON.stringify({ error: 'Empty API Key', errorCode: 'EmptyAPIKey' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  let modifiedAzureEndpoint = (
    azureEndpoint ||
    process.env.AZURE_ENDPOINT ||
    ''
  ).replace(/^https:\/\/|\.openai\.azure\.com.*$/g, '')
  let modifiedAzureDeployment =
    (azureEndpoint || process.env.AZURE_ENDPOINT || '').match(
      /\/deployments\/([^\/]+)/
    )?.[1] || ''
  let modifiedModel = aiService === 'azure' ? modifiedAzureDeployment : model

  if (!aiService || !modifiedModel) {
    return new Response(
      JSON.stringify({
        error: 'Invalid AI service or model',
        errorCode: 'AIInvalidProperty',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const aiServiceConfig: AIServiceConfig = {
    openai: () => createOpenAI({ apiKey: aiApiKey }),
    anthropic: () => createAnthropic({ apiKey: aiApiKey }),
    google: () => createGoogleGenerativeAI({ apiKey: aiApiKey }),
    azure: () =>
      createAzure({
        resourceName: modifiedAzureEndpoint,
        apiKey: aiApiKey,
      }),
    groq: () =>
      createOpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: aiApiKey,
      }),
    cohere: () => createCohere({ apiKey: aiApiKey }),
    mistralai: () => createMistral({ apiKey: aiApiKey }),
    perplexity: () =>
      createOpenAI({ baseURL: 'https://api.perplexity.ai/', apiKey: aiApiKey }),
    fireworks: () =>
      createOpenAI({
        baseURL: 'https://api.fireworks.ai/inference/v1',
        apiKey: aiApiKey,
      }),
  }
  const aiServiceInstance = aiServiceConfig[aiService as AIServiceKey]

  if (!aiServiceInstance) {
    return new Response(
      JSON.stringify({
        error: 'Invalid AI service',
        errorCode: 'InvalidAIService',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const instance = aiServiceInstance()
  const modifiedMessages: Message[] = modifyMessages(aiService, messages)

  try {
    if (stream) {
      const weather = new WeatherClient()
      const tavily = new TavilyClient()
      const tools = createAISDKTools(weather, tavily)
      const jsonDate: {
        model: any
        messages: CoreMessage[]
        tools?: Record<string, CoreTool<any, any>>
        toolChoice?: 'none' | 'auto'
      } = {
        model: instance(modifiedModel),
        messages: modifiedMessages as CoreMessage[],
        tools: tools,
      }

      if (!toolRequired) {
        jsonDate['toolChoice'] = 'none'
      }

      const result = await streamText(jsonDate)

      return result.toDataStreamResponse()
    } else {
      const result = await generateText({
        model: instance(model),
        messages: modifiedMessages as CoreMessage[],
      })

      return new Response(JSON.stringify({ text: result.text }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    console.error('Error in AI API call:', error)

    return new Response(
      JSON.stringify({
        error: 'Unexpected Error',
        errorCode: 'AIAPIError',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

function modifyMessages(aiService: string, messages: Message[]): Message[] {
  if (aiService === 'anthropic' || aiService === 'perplexity') {
    return modifyAnthropicMessages(messages)
  }
  return messages
}

// Anthropicのメッセージを修正する
function modifyAnthropicMessages(messages: Message[]): Message[] {
  const systemMessage: Message | undefined = messages.find(
    (message) => message.role === 'system'
  )
  let userMessages = messages
    .filter((message) => message.role !== 'system')
    .filter((message) => message.content !== '')

  userMessages = consolidateMessages(userMessages)

  while (userMessages.length > 0 && userMessages[0].role !== 'user') {
    userMessages.shift()
  }

  const result: Message[] = systemMessage
    ? [systemMessage, ...userMessages]
    : userMessages
  return result
}

// 同じroleのメッセージを結合する
function consolidateMessages(messages: Message[]) {
  const consolidated: Message[] = []
  let lastRole: string | null = null
  let combinedContent:
    | string
    | [
        {
          type: 'text'
          text: string
        },
        {
          type: 'image'
          image: string
        },
      ]

  messages.forEach((message, index) => {
    if (message.role === lastRole) {
      if (typeof combinedContent === 'string') {
        combinedContent += '\n' + message.content
      } else {
        combinedContent[0].text += '\n' + message.content
      }
    } else {
      if (lastRole !== null) {
        consolidated.push({ role: lastRole, content: combinedContent })
      }
      lastRole = message.role
      combinedContent = message.content || ''
    }

    if (index === messages.length - 1) {
      consolidated.push({ role: lastRole, content: combinedContent })
    }
  })

  return consolidated
}
