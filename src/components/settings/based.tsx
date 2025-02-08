import { useTranslation } from 'react-i18next'
import i18n from 'i18next'

import { Language } from '@/features/constants/settings'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'

const Based = () => {
  const { t } = useTranslation()
  const selectLanguage = settingsStore((s) => s.selectLanguage)

  return (
    <>
      <div className="mb-24">
        <div className="mb-16 typography-20 font-bold">{t('Language')}</div>
        <div className="my-8">
          <select
            className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8"
            value={selectLanguage}
            onChange={(e) => {
              const newLanguage = e.target.value as Language

              const ss = settingsStore.getState()
              const jaVoiceSelected =
                ss.selectVoice === 'voicevox' ||
                ss.selectVoice === 'koeiromap' ||
                ss.selectVoice === 'aivis_speech' ||
                ss.selectVoice === 'nijivoice'

              switch (newLanguage) {
                case 'ja':
                  settingsStore.setState({ selectLanguage: 'ja' })

                  i18n.changeLanguage('ja')
                  break
                case 'en':
                  settingsStore.setState({ selectLanguage: 'en' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('en')
                  break
                case 'zh':
                  settingsStore.setState({ selectLanguage: 'zh' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('zh-TW')
                  break
                case 'ko':
                  settingsStore.setState({ selectLanguage: 'ko' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('ko')
                  break
                default:
                  break
              }
            }}
          >
            <option value="ja">日本語 - Japanese</option>
            <option value="en">英語 - English</option>
            <option value="zh">繁體中文 - Traditional Chinese</option>
            <option value="ko">韓語 - Korean</option>
          </select>
        </div>
      </div>
      <div className="mt-24">
        <div className="my-16 typography-20 font-bold">
          {t('BackgroundImage')}
        </div>
        <div className="my-8">
          <TextButton
            onClick={() => {
              const { bgFileInput } = menuStore.getState()
              bgFileInput?.click()
            }}
          >
            {t('ChangeBackgroundImage')}
          </TextButton>
        </div>
      </div>
    </>
  )
}
export default Based
