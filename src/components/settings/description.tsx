import { useTranslation } from 'react-i18next'

const Description = () => {
  const { t } = useTranslation()

  return (
    <>
      <div className="mb-24">
        <div className="mb-24">
          <div className="mb-16 typography-20 font-bold">
            {t('AboutThisApplication')}
          </div>
          <div className="my-8 whitespace-pre-line">
            {t('AboutThisApplicationDescription2')}
          </div>
        </div>
        <div className="my-40">
          <div className="mb-16 typography-20 font-bold">{t('Contact')}</div>
          <div className="my-8 whitespace-pre-line">
            <a href="mailto:support@aituberkit.com">
              Email: support@aituberkit.com
            </a>
          </div>
          <div className="my-8 whitespace-pre-line">
            <a href="https://twitter.com/tegnike">Twitter: @tegnike</a>
          </div>
        </div>
        <div className="mt-40">
          <div className="mb-16 typography-20 font-bold">{t('Creator')}</div>
          <div className="my-8 whitespace-pre-line">
            {t('CreatorDescription')}
          </div>
          <div className="my-8 whitespace-pre-line">
            <a href="https://nikechan.com">URL: https://nikechan.com</a>
          </div>
        </div>
      </div>
    </>
  )
}
export default Description
