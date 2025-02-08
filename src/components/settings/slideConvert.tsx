import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import settingsStore, {
  multiModalAIServiceKey,
  multiModalAIServices,
} from '@/features/stores/settings'
import { TextButton } from '../textButton'

interface SlideConvertProps {
  onFolderUpdate: () => void // フォルダ更新のための関数
}

const SlideConvert: React.FC<SlideConvertProps> = ({ onFolderUpdate }) => {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [folderName, setFolderName] = useState<string>('')
  const aiService = settingsStore.getState()
    .selectAIService as multiModalAIServiceKey

  const [model, setModel] = useState<string>('')

  useEffect(() => {
    switch (aiService) {
      case 'openai':
        setModel('gpt-4o')
        break
      case 'anthropic':
        setModel('claude-3-5-sonnet-20241022')
        break
      case 'google':
        setModel('gemini-1.5-flash-latest')
        break
      default:
        setModel('')
    }
  }, [aiService])

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const selectLanguage = settingsStore.getState().selectLanguage
  const [selectedFileName, setSelectedFileName] = useState<string>('')

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      const selectedFile = event.target.files[0]
      setFile(selectedFile)
      setSelectedFileName(selectedFile.name)
    }
  }

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!multiModalAIServices.includes(aiService)) {
      alert(t('InvalidAIService'))
      return
    }

    const apiKeyName = `${aiService}Key` as const
    const apiKey = settingsStore.getState()[apiKeyName]

    if (!file || !folderName || !apiKey || !model) {
      alert(t('PdfConvertSubmitError'))
      return
    }

    setIsLoading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folderName', folderName)
    formData.append('aiService', aiService)
    formData.append('apiKey', apiKey)
    formData.append('model', model)
    formData.append('selectLanguage', selectLanguage)

    const response = await fetch('/api/convertSlide', {
      method: 'POST',
      body: formData,
    })
    setIsLoading(false)

    // フォルダ更新関数を呼び出す
    if (response.ok) {
      onFolderUpdate()
      alert(t('PdfConvertSuccess'))
    } else {
      alert(t('PdfConvertError'))
    }
  }

  return (
    <div className="mt-24">
      <form onSubmit={handleFormSubmit}>
        <div className="my-16 mb-16 typography-20 font-bold">
          {t('PdfConvertLabel')}
        </div>
        <p className="">{t('PdfConvertDescription')}</p>
        <div className="my-16 flex items-center">
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="fileInput"
            accept=".pdf"
          />
          <TextButton
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('fileInput')?.click()
            }}
            type="button"
          >
            {t('PdfConvertFileUpload')}
          </TextButton>
          {selectedFileName && (
            <span className="ml-16 text-ellipsis overflow-hidden">
              {selectedFileName}
            </span>
          )}
        </div>
        <div className="my-16 font-bold">{t('PdfConvertFolderName')}</div>
        <input
          type="text"
          placeholder="Folder Name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          required
          className="text-ellipsis px-16 py-8 w-col-span-4 bg-surface1 hover:bg-surface1-hover rounded-8"
        />
        <div className="my-16 font-bold">{t('PdfConvertModelSelect')}</div>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="text-ellipsis px-16 py-8 w-col-span-4 bg-surface1 hover:bg-surface1-hover rounded-8"
        >
          {aiService === 'openai' && (
            <>
              <option value="chatgpt-4o-latest">chatgpt-4o-latest</option>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-4o-2024-08-06">gpt-4o-2024-08-06</option>
              <option value="gpt-4o-2024-11-20">gpt-4o-2024-11-20</option>
              <option value="gpt-4-turbo">gpt-4-turbo</option>
            </>
          )}
          {aiService === 'anthropic' && (
            <>
              <option value="claude-3-opus-20240229">
                claude-3-opus-20240229
              </option>
              <option value="claude-3-5-sonnet-20241022">
                claude-3.5-sonnet-20241022
              </option>
              <option value="claude-3-5-haiku-20241022">
                claude-3.5-haiku-20241022
              </option>
            </>
          )}
          {aiService === 'google' && (
            <>
              <option value="gemini-2.0-flash-001">gemini-2.0-flash-001</option>
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
            </>
          )}
        </select>
        <div className="mt-16">
          <TextButton type="submit" disabled={isLoading}>
            {isLoading ? t('PdfConvertLoading') : t('PdfConvertButton')}
          </TextButton>
        </div>
      </form>
    </div>
  )
}

export default SlideConvert
