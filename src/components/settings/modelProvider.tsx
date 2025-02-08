import { useTranslation } from 'react-i18next'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import slideStore from '@/features/stores/slide'
import { Link } from '../link'
import { TextButton } from '../textButton'
import { useCallback } from 'react'
import {
  multiModalAIServices,
  googleSearchGroundingModels,
} from '@/features/stores/settings'
import {
  AudioModeInputType,
  OpenAITTSVoice,
  RealtimeAPIModeContentType,
  RealtimeAPIModeVoice,
  RealtimeAPIModeAzureVoice,
} from '@/features/constants/settings'
import toastStore from '@/features/stores/toast'
import webSocketStore from '@/features/stores/websocketStore'

const ModelProvider = () => {
  const externalLinkageMode = settingsStore((s) => s.externalLinkageMode)
  const realtimeAPIMode = settingsStore((s) => s.realtimeAPIMode)
  const realtimeAPIModeContentType = settingsStore(
    (s) => s.realtimeAPIModeContentType
  )
  const realtimeAPIModeVoice = settingsStore((s) => s.realtimeAPIModeVoice)
  const audioMode = settingsStore((s) => s.audioMode)
  const audioModeInputType = settingsStore((s) => s.audioModeInputType)
  const audioModeVoice = settingsStore((s) => s.audioModeVoice)
  const openaiKey = settingsStore((s) => s.openaiKey)
  const anthropicKey = settingsStore((s) => s.anthropicKey)
  const googleKey = settingsStore((s) => s.googleKey)
  const azureKey = settingsStore((s) => s.azureKey)
  const azureEndpoint = settingsStore((s) => s.azureEndpoint)
  const groqKey = settingsStore((s) => s.groqKey)
  const cohereKey = settingsStore((s) => s.cohereKey)
  const mistralaiKey = settingsStore((s) => s.mistralaiKey)
  const perplexityKey = settingsStore((s) => s.perplexityKey)
  const fireworksKey = settingsStore((s) => s.fireworksKey)
  const difyKey = settingsStore((s) => s.difyKey)
  const useSearchGrounding = settingsStore((s) => s.useSearchGrounding)
  const deepseekKey = settingsStore((s) => s.deepseekKey)
  const maxPastMessages = settingsStore((s) => s.maxPastMessages)
  const temperature = settingsStore((s) => s.temperature)

  const selectAIService = settingsStore((s) => s.selectAIService)
  const selectAIModel = settingsStore((s) => s.selectAIModel)
  const localLlmUrl = settingsStore((s) => s.localLlmUrl)
  const systemPrompt = settingsStore((s) => s.systemPrompt)

  const difyUrl = settingsStore((s) => s.difyUrl)

  const { t } = useTranslation()

  // オブジェクトを定義して、各AIサービスのデフォルトモデルを保存する
  // ローカルLLMが選択された場合、AIモデルを空文字に設定
  const defaultModels = {
    openai: 'gpt-4o-2024-11-20',
    anthropic: 'claude-3-5-sonnet-20241022',
    google: 'gemini-1.5-flash-latest',
    azure: '',
    groq: 'gemma2-9b-it',
    cohere: 'command-r-plus',
    mistralai: 'mistral-large-latest',
    perplexity: 'llama-3-sonar-large-32k-online',
    fireworks: 'accounts/fireworks/models/firefunction-v2',
    localLlm: '',
    dify: '',
    deepseek: 'deepseek-chat',
  }

  const handleAIServiceChange = useCallback(
    (newService: keyof typeof defaultModels) => {
      settingsStore.setState({
        selectAIService: newService,
        selectAIModel: defaultModels[newService],
      })

      if (!multiModalAIServices.includes(newService as any)) {
        menuStore.setState({ showWebcam: false })

        settingsStore.setState({
          conversationContinuityMode: false,
          slideMode: false,
        })
        slideStore.setState({
          isPlaying: false,
        })
      }

      if (newService !== 'openai' && newService !== 'azure') {
        settingsStore.setState({ realtimeAPIMode: false })
      }

      if (newService === 'google') {
        if (!googleSearchGroundingModels.includes(selectAIModel as any)) {
          settingsStore.setState({ useSearchGrounding: false })
        }
      }
    },
    []
  )

  const handleRealtimeAPIModeChange = useCallback((newMode: boolean) => {
    settingsStore.setState({
      realtimeAPIMode: newMode,
    })
    if (newMode) {
      settingsStore.setState({ audioMode: false })
      settingsStore.setState({
        selectAIModel: 'gpt-4o-realtime-preview-2024-12-17',
      })
    }
  }, [])

  const handleAudioModeChange = useCallback((newMode: boolean) => {
    settingsStore.setState({
      audioMode: newMode,
    })
    if (newMode) {
      settingsStore.setState({ realtimeAPIMode: false })
      settingsStore.setState({
        selectAIModel: 'gpt-4o-audio-preview-2024-12-17',
      })
    }
  }, [])

  const handleUpdate = useCallback(() => {
    const wsManager = webSocketStore.getState().wsManager
    if (!wsManager || !wsManager.reconnect()) {
      toastStore.getState().addToast({
        message: t('Toasts.WebSocketReconnectFailed'),
        type: 'error',
        duration: 3000,
      })
    }
  }, [t])

  return externalLinkageMode ? null : (
    <div className="mt-24">
      <div className="my-16 typography-20 font-bold">
        {t('SelectAIService')}
      </div>
      <div className="my-8">
        <select
          className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8"
          value={selectAIService}
          onChange={(e) =>
            handleAIServiceChange(e.target.value as keyof typeof defaultModels)
          }
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="google">Google Gemini</option>
          <option value="azure">Azure OpenAI</option>
          <option value="groq">Groq</option>
          <option value="cohere">Cohere</option>
          <option value="mistralai">Mistral AI</option>
          <option value="perplexity">Perplexity</option>
          <option value="fireworks">Fireworks</option>
          <option value="localLlm">{t('LocalLLM')}</option>
          <option value="dify">Dify</option>
          <option value="deepseek">DeepSeek</option>
        </select>
      </div>
      {(() => {
        if (selectAIService === 'openai') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('OpenAIAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link
                    url="https://platform.openai.com/account/api-keys"
                    label="OpenAI"
                  />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={(e) =>
                    settingsStore.setState({ openaiKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('RealtimeAPIMode')}
                </div>
                <div className="my-8">
                  <TextButton
                    onClick={() => {
                      handleRealtimeAPIModeChange(!realtimeAPIMode)
                    }}
                  >
                    {realtimeAPIMode ? t('StatusOn') : t('StatusOff')}
                  </TextButton>
                </div>
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('AudioMode')}
                </div>
                <div className="my-8">
                  <TextButton
                    onClick={() => {
                      handleAudioModeChange(!audioMode)
                    }}
                  >
                    {audioMode ? t('StatusOn') : t('StatusOff')}
                  </TextButton>
                </div>
              </div>
              {realtimeAPIMode && (
                <>
                  <div className="my-16 font-bold">
                    {t('RealtimeAPIModeContentType')}
                  </div>
                  <select
                    className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                    value={realtimeAPIModeContentType}
                    onChange={(e) => {
                      const model = e.target.value
                      settingsStore.setState({
                        realtimeAPIModeContentType:
                          model as RealtimeAPIModeContentType,
                      })
                    }}
                  >
                    <option value="input_text">{t('InputText')}</option>
                    <option value="input_audio">{t('InputAudio')}</option>
                  </select>
                  <div className="my-16 font-bold">
                    {t('RealtimeAPIModeVoice')}
                  </div>
                  <select
                    className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                    value={realtimeAPIModeVoice}
                    onChange={(e) => {
                      const model = e.target.value
                      settingsStore.setState({
                        realtimeAPIModeVoice: model as RealtimeAPIModeVoice,
                      })
                    }}
                  >
                    <option value="alloy">alloy</option>
                    <option value="ash">ash</option>
                    <option value="ballad">ballad</option>
                    <option value="coral">coral</option>
                    <option value="echo">echo</option>
                    <option value="sage">sage</option>
                    <option value="shimmer">shimmer</option>
                    <option value="verse">verse</option>
                  </select>
                  <div className="my-24">
                    <div className="my-16 typography-16 font-bold">
                      {t('SelectModel')}
                    </div>
                    <select
                      className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                      value={selectAIModel}
                      onChange={(e) => {
                        const model = e.target.value
                        settingsStore.setState({ selectAIModel: model })
                      }}
                    >
                      <option value="gpt-4o-realtime-preview-2024-10-01">
                        gpt-4o-realtime-preview-2024-10-01
                      </option>
                      <option value="gpt-4o-realtime-preview-2024-12-17">
                        gpt-4o-realtime-preview-2024-12-17
                      </option>
                      <option value="gpt-4o-mini-realtime-preview-2024-12-17">
                        gpt-4o-mini-realtime-preview-2024-12-17
                      </option>
                    </select>
                  </div>
                  <div className="my-16">
                    <div className="my-16">
                      {t('UpdateRealtimeAPISettingsInfo')}
                    </div>
                    <TextButton onClick={handleUpdate}>
                      {t('UpdateRealtimeAPISettings')}
                    </TextButton>
                  </div>
                </>
              )}
              {audioMode && (
                <>
                  <div className="my-16 font-bold">
                    {t('RealtimeAPIModeContentType')}
                  </div>
                  <select
                    className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                    value={audioModeInputType}
                    onChange={(e) => {
                      const model = e.target.value
                      settingsStore.setState({
                        audioModeInputType: model as AudioModeInputType,
                      })
                    }}
                  >
                    <option value="input_text">{t('InputText')}</option>
                    <option value="input_audio">{t('InputAudio')}</option>
                  </select>
                  <div className="my-16 font-bold">
                    {t('RealtimeAPIModeVoice')}
                  </div>
                  <select
                    className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                    value={audioModeVoice}
                    onChange={(e) => {
                      const model = e.target.value
                      settingsStore.setState({
                        audioModeVoice: model as OpenAITTSVoice,
                      })
                    }}
                  >
                    <option value="alloy">alloy</option>
                    <option value="echo">echo</option>
                    <option value="fable">fable</option>
                    <option value="onyx">onyx</option>
                    <option value="nova">nova</option>
                    <option value="shimmer">shimmer</option>
                  </select>
                  <div className="my-24">
                    <div className="my-16 typography-16 font-bold">
                      {t('SelectModel')}
                    </div>
                    <select
                      className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                      value={selectAIModel}
                      onChange={(e) => {
                        const model = e.target.value
                        settingsStore.setState({ selectAIModel: model })
                      }}
                    >
                      <option value="gpt-4o-audio-preview-2024-10-01">
                        gpt-4o-audio-preview-2024-10-01
                      </option>
                      <option value="gpt-4o-audio-preview-2024-12-17">
                        gpt-4o-audio-preview-2024-12-17
                      </option>
                      <option value="gpt-4o-mini-audio-preview-2024-12-17">
                        gpt-4o-mini-audio-preview-2024-12-17
                      </option>
                    </select>
                  </div>
                </>
              )}
              {!realtimeAPIMode && !audioMode && (
                <div className="my-24">
                  <div className="my-16 typography-20 font-bold">
                    {t('SelectModel')}
                  </div>
                  <select
                    className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                    value={selectAIModel}
                    onChange={(e) => {
                      const model = e.target.value
                      settingsStore.setState({ selectAIModel: model })

                      if (
                        model !== 'gpt-4-turbo' &&
                        model !== 'gpt-4o' &&
                        model !== 'gpt-4o-mini'
                      ) {
                        menuStore.setState({ showWebcam: false })
                      }
                    }}
                  >
                    <option value="chatgpt-4o-latest">chatgpt-4o-latest</option>
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="gpt-4o-2024-08-06">gpt-4o-2024-08-06</option>
                    <option value="gpt-4o-2024-11-20">gpt-4o-2024-11-20</option>
                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                  </select>
                </div>
              )}
            </>
          )
        } else if (selectAIService === 'anthropic') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('AnthropicAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link url="https://console.anthropic.com" label="Anthropic" />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={anthropicKey}
                  onChange={(e) =>
                    settingsStore.setState({ anthropicKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <select
                  className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  value={selectAIModel}
                  onChange={(e) =>
                    settingsStore.setState({
                      selectAIModel: e.target.value,
                    })
                  }
                >
                  <option value="claude-3-opus-20240229">
                    claude-3-opus-20240229
                  </option>
                  <option value="claude-3-5-sonnet-20241022">
                    claude-3.5-sonnet-20241022
                  </option>
                  <option value="claude-3-5-haiku-20241022">
                    claude-3.5-haiku-20241022
                  </option>
                </select>
              </div>
            </>
          )
        } else if (selectAIService === 'google') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('GoogleAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link
                    url="https://aistudio.google.com/app/apikey?hl=ja"
                    label="Google AI Studio"
                  />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={googleKey}
                  onChange={(e) =>
                    settingsStore.setState({ googleKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <select
                  className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  value={selectAIModel}
                  onChange={(e) => {
                    const model = e.target.value
                    settingsStore.setState({
                      selectAIModel: model,
                    })

                    // Add check for search grounding compatibility
                    if (!googleSearchGroundingModels.includes(model as any)) {
                      settingsStore.setState({ useSearchGrounding: false })
                    }
                  }}
                >
                  <option value="gemini-2.0-flash-001">
                    gemini-2.0-flash-001
                  </option>
                  <option value="gemini-2.0-flash-lite-preview-02-05">
                    gemini-2.0-flash-lite-preview-02-05
                  </option>
                  <option value="gemini-1.5-flash-latest">
                    gemini-1.5-flash-latest
                  </option>
                  <option value="gemini-1.5-flash-8b-latest">
                    gemini-1.5-flash-8b-latest
                  </option>
                  <option value="gemini-1.5-pro-latest">
                    gemini-1.5-pro-latest
                  </option>
                </select>
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SearchGrounding')}
                </div>
                <div className="my-16">{t('SearchGroundingDescription')}</div>
                <div className="my-8">
                  <TextButton
                    onClick={() => {
                      settingsStore.setState({
                        useSearchGrounding: !useSearchGrounding,
                      })
                    }}
                    disabled={
                      !googleSearchGroundingModels.includes(
                        selectAIModel as any
                      )
                    }
                  >
                    {useSearchGrounding ? t('StatusOn') : t('StatusOff')}
                  </TextButton>
                </div>
              </div>
            </>
          )
        } else if (selectAIService === 'azure') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('AzureAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link
                    url="https://portal.azure.com/#view/Microsoft_Azure_AI/AzureOpenAI/keys"
                    label="Azure OpenAI"
                  />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={azureKey}
                  onChange={(e) =>
                    settingsStore.setState({ azureKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('AzureEndpoint')}
                </div>
                <div className="my-16">
                  Chat API ex.
                  https://RESOURCE_NAME.openai.azure.com/openai/deployments/DEPLOYMENT_NAME/chat/completions?api-version=API_VERSION
                  <br />
                  Realtime API ex.
                  wss://RESOURCE_NAME.openai.azure.com/openai/realtime?api-version=API_VERSION&deployment=DEPLOYMENT_NAME
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={azureEndpoint}
                  onChange={(e) =>
                    settingsStore.setState({ azureEndpoint: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('RealtimeAPIMode')}
                </div>
                <div className="my-8">
                  <TextButton
                    onClick={() => {
                      handleRealtimeAPIModeChange(!realtimeAPIMode)
                    }}
                  >
                    {realtimeAPIMode ? t('StatusOn') : t('StatusOff')}
                  </TextButton>
                </div>
                {realtimeAPIMode && (
                  <>
                    <div className="my-16 font-bold">
                      {t('RealtimeAPIModeContentType')}
                    </div>
                    <select
                      className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                      value={realtimeAPIModeContentType}
                      onChange={(e) => {
                        const model = e.target.value
                        settingsStore.setState({
                          realtimeAPIModeContentType:
                            model as RealtimeAPIModeContentType,
                        })
                      }}
                    >
                      <option value="input_text">{t('InputText')}</option>
                      <option value="input_audio">{t('InputAudio')}</option>
                    </select>
                    <div className="my-16 font-bold">
                      {t('RealtimeAPIModeVoice')}
                    </div>
                    <select
                      className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                      value={realtimeAPIModeVoice}
                      onChange={(e) => {
                        const model = e.target.value
                        settingsStore.setState({
                          realtimeAPIModeVoice:
                            model as RealtimeAPIModeAzureVoice,
                        })
                      }}
                    >
                      <option value="alloy">alloy</option>
                      <option value="amuch">amuch</option>
                      <option value="breeze">breeze</option>
                      <option value="cove">cove</option>
                      <option value="dan">dan</option>
                      <option value="echo">echo</option>
                      <option value="elan">elan</option>
                      <option value="ember">ember</option>
                      <option value="jupiter">jupiter</option>
                      <option value="marilyn">marilyn</option>
                      <option value="shimmer">shimmer</option>
                    </select>
                    <div className="my-16">
                      <div className="my-16">
                        {t('UpdateRealtimeAPISettingsInfo')}
                      </div>
                      <TextButton onClick={handleUpdate}>
                        {t('UpdateRealtimeAPISettings')}
                      </TextButton>
                    </div>
                  </>
                )}
              </div>
            </>
          )
        } else if (selectAIService === 'groq') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('GroqAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link
                    url="https://console.groq.com/keys"
                    label="Groq Dashboard"
                  />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={groqKey}
                  onChange={(e) =>
                    settingsStore.setState({ groqKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <select
                  className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  value={selectAIModel}
                  onChange={(e) =>
                    settingsStore.setState({
                      selectAIModel: e.target.value,
                    })
                  }
                >
                  <option value="gemma2-9b-it">gemma2-9b-it</option>
                  <option value="llama-3.3-70b-versatile">
                    llama-3.3-70b-versatile
                  </option>
                  <option value="llama3-8b-8192">llama3-8b-8192</option>
                  <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                </select>
              </div>
            </>
          )
        } else if (selectAIService === 'cohere') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('CohereAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link
                    url="https://dashboard.cohere.com/api-keys"
                    label="Cohere Dashboard"
                  />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={cohereKey}
                  onChange={(e) =>
                    settingsStore.setState({ cohereKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <select
                  className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  value={selectAIModel}
                  onChange={(e) =>
                    settingsStore.setState({
                      selectAIModel: e.target.value,
                    })
                  }
                >
                  <option value="command-light">command-light</option>
                  <option value="command-light-nightly">
                    command-light-nightly
                  </option>
                  <option value="command-nightly">command-nightly</option>
                  <option value="command-r">command-r</option>
                  <option value="command-r-08-2024">command-r-08-2024</option>
                  <option value="command-r-plus">command-r-plus</option>
                  <option value="command-r-plus-08-2024">
                    command-r-plus-08-2024
                  </option>
                </select>
              </div>
            </>
          )
        } else if (selectAIService === 'mistralai') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('MistralAIAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link
                    url="https://console.mistral.ai/api-keys/"
                    label="Mistral AI Dashboard"
                  />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={mistralaiKey}
                  onChange={(e) =>
                    settingsStore.setState({ mistralaiKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <select
                  className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  value={selectAIModel}
                  onChange={(e) =>
                    settingsStore.setState({
                      selectAIModel: e.target.value,
                    })
                  }
                >
                  <option value="mistral-large-latest">
                    mistral-large-latest
                  </option>
                  <option value="open-mistral-nemo">open-mistral-nemo</option>
                  <option value="codestral-latest">codestral-latest</option>
                  <option value="mistral-embed">mistral-embed</option>
                </select>
              </div>
            </>
          )
        } else if (selectAIService === 'perplexity') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('PerplexityAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link
                    url="https://www.perplexity.ai/settings/api"
                    label="Perplexity Dashboard"
                  />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={perplexityKey}
                  onChange={(e) =>
                    settingsStore.setState({ perplexityKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <select
                  className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  value={selectAIModel}
                  onChange={(e) =>
                    settingsStore.setState({
                      selectAIModel: e.target.value,
                    })
                  }
                >
                  <option value="llama-3.1-sonar-small-128k-online">
                    llama-3.1-sonar-small-128k-online
                  </option>
                  <option value="llama-3.1-sonar-large-128k-online">
                    llama-3.1-sonar-large-128k-online
                  </option>
                  <option value="llama-3.1-sonar-huge-128k-online">
                    llama-3.1-sonar-huge-128k-online
                  </option>
                  <option value="llama-3.1-sonar-small-128k-chat">
                    llama-3.1-sonar-small-128k-chat
                  </option>
                  <option value="llama-3.1-sonar-large-128k-chat">
                    llama-3.1-sonar-large-128k-chat
                  </option>
                </select>
              </div>
            </>
          )
        } else if (selectAIService === 'fireworks') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('FireworksAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link
                    url="https://fireworks.ai/account/api-keys"
                    label="Fireworks Dashboard"
                  />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={fireworksKey}
                  onChange={(e) =>
                    settingsStore.setState({ fireworksKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <select
                  className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  value={selectAIModel}
                  onChange={(e) =>
                    settingsStore.setState({
                      selectAIModel: e.target.value,
                    })
                  }
                >
                  <option value="accounts/fireworks/models/llama-v3p1-405b-instruct">
                    llama-v3p1-405b-instruct
                  </option>
                  <option value="accounts/fireworks/models/llama-v3p1-70b-instruct">
                    llama-v3p1-70b-instruct
                  </option>
                  <option value="accounts/fireworks/models/llama-v3p1-8b-instruct">
                    llama-v3p1-8b-instruct
                  </option>
                  <option value="accounts/fireworks/models/llama-v3-70b-instruct">
                    llama-v3-70b-instruct
                  </option>
                  <option value="accounts/fireworks/models/mixtral-8x22b-instruct">
                    mixtral-8x22b-instruct
                  </option>
                  <option value="accounts/fireworks/models/mixtral-8x7b-instruct">
                    mixtral-8x7b-instruct
                  </option>
                  <option value="accounts/fireworks/models/firefunction-v2">
                    firefunction-v2
                  </option>
                </select>
              </div>
            </>
          )
        } else if (selectAIService === 'localLlm') {
          return (
            <>
              <div className="my-24">
                <div className="my-16">
                  {t('LocalLLMInfo')}
                  <br />
                  ex. Ollama:{' '}
                  <Link
                    url="https://note.com/schroneko/n/n8b1a5bbc740b"
                    label="https://note.com/schroneko/n/n8b1a5bbc740b"
                  />
                </div>
                <div className="my-16">
                  {t('LocalLLMInfo2')}
                  <br />
                  ex. Ollama: http://localhost:11434/v1/chat/completions
                  <br />
                  ex. LM Studio: http://localhost:1234/v1/chat/completions
                </div>
                <div className="my-16 typography-20 font-bold">
                  {t('EnterURL')}
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={localLlmUrl}
                  onChange={(e) =>
                    settingsStore.setState({ localLlmUrl: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={selectAIModel}
                  onChange={(e) =>
                    settingsStore.setState({
                      selectAIModel: e.target.value,
                    })
                  }
                />
              </div>
            </>
          )
        } else if (selectAIService === 'dify') {
          return (
            <>
              <div className="my-24">
                <div className="my-16">{t('DifyInfo')}</div>
                <div className="my-16 typography-20 font-bold">
                  {t('DifyAPIKeyLabel')}
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={difyKey}
                  onChange={(e) =>
                    settingsStore.setState({ difyKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('EnterURL')}
                </div>
                <div className="my-16">{t('DifyInfo3')}</div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={difyUrl}
                  onChange={(e) =>
                    settingsStore.setState({ difyUrl: e.target.value })
                  }
                />
              </div>
            </>
          )
        } else if (selectAIService === 'deepseek') {
          return (
            <div className="my-24">
              <div className="my-16 typography-20 font-bold">
                {t('DeepSeekAPIKeyLabel')}
              </div>
              <div className="my-16">
                {t('APIKeyInstruction')}
                <br />
                <Link
                  url="https://platform.deepseek.com/api_keys"
                  label="DeepSeek"
                />
              </div>
              <input
                className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                type="text"
                placeholder="sk-..."
                value={deepseekKey}
                onChange={(e) =>
                  settingsStore.setState({ deepseekKey: e.target.value })
                }
              />
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <select
                  className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  value={selectAIModel}
                  onChange={(e) =>
                    settingsStore.setState({
                      selectAIModel: e.target.value,
                    })
                  }
                >
                  <option value="deepseek-chat">deepseek-chat</option>
                  <option value="deepseek-reasoner">deepseek-reasoner</option>
                </select>
              </div>
            </div>
          )
        }
      })()}
      {selectAIService !== 'dify' && (
        <>
          <div className="my-24">
            <div className="my-16 typography-20 font-bold">
              {t('MaxPastMessages')}
            </div>
            <div className="my-8">
              <input
                type="number"
                min="1"
                max="100"
                className="px-16 py-8 w-64 bg-surface1 hover:bg-surface1-hover rounded-8"
                value={maxPastMessages}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  if (
                    Number.isNaN(value) === false &&
                    value >= 1 &&
                    value <= 100
                  ) {
                    settingsStore.setState({ maxPastMessages: value })
                  }
                }}
              />
            </div>
          </div>
          <div className="my-24">
            <div className="my-16 typography-20 font-bold">
              {t('Temperature')}: {temperature.toFixed(2)}
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.01}
              value={temperature}
              className="mt-8 mb-16 input-range"
              onChange={(e) =>
                settingsStore.setState({
                  temperature: parseFloat(e.target.value),
                })
              }
            />
          </div>
        </>
      )}
    </div>
  )
}
export default ModelProvider
