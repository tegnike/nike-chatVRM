import { KnownIconType } from '@charcoal-ui/icons'
import { ButtonHTMLAttributes } from 'react'
import Image from 'next/image'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  iconName: keyof KnownIconType | 'screen-share' | 'stop'
  isProcessing: boolean
  isProcessingIcon?: keyof KnownIconType
  label?: string
  iconColor?: string
}

export const IconButton = ({
  iconName,
  isProcessing,
  isProcessingIcon,
  label,
  iconColor,
  ...rest
}: Props) => {
  return (
    <button
      {...rest}
      className={`bg-primary hover:bg-primary-hover active:bg-primary-press disabled:bg-primary-disabled rounded-16 text-sm p-8 text-center inline-flex items-center mr-2
        ${iconColor || 'text-white'}
        ${rest.className}
      `}
    >
      {isProcessing ? (
        <pixiv-icon name={isProcessingIcon || '24/Dot'} scale="1"></pixiv-icon>
      ) : iconName === 'screen-share' ? (
        <Image
          src="/icons/screen-share.svg"
          alt="screen share"
          width={24}
          height={24}
        />
      ) : iconName === 'stop' ? (
        <Image src="/icons/stop.svg" alt="stop" width={24} height={24} />
      ) : (
        <pixiv-icon name={iconName} scale="1"></pixiv-icon>
      )}
      {label && <div className="mx-4 font-bold">{label}</div>}
    </button>
  )
}
