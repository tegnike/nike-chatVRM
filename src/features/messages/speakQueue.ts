import { Talk } from './messages'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { Live2DHandler } from './live2dHandler'

type SpeakTask = {
  audioBuffer: ArrayBuffer
  talk: Talk
  isNeedDecode: boolean
  onComplete?: () => void
}

export class SpeakQueue {
  private static readonly QUEUE_CHECK_DELAY = 1500
  private queue: SpeakTask[] = []
  private isProcessing = false
  private currentSessionId: string | null = null

  async addTask(task: SpeakTask) {
    this.queue.push(task)
    await this.processQueue()
  }

  private async processQueue() {
    if (this.isProcessing) return

    this.isProcessing = true
    const hs = homeStore.getState()
    const ss = settingsStore.getState()

    while (this.queue.length > 0 && hs.isSpeaking) {
      const currentState = homeStore.getState()
      if (!currentState.isSpeaking) {
        this.clearQueue()
        homeStore.setState({ isSpeaking: false })
        break
      }

      const task = this.queue.shift()
      if (task) {
        try {
          const { audioBuffer, talk, isNeedDecode, onComplete } = task
          if (ss.modelType === 'live2d') {
            await Live2DHandler.speak(audioBuffer, talk, isNeedDecode)
          } else {
            await hs.viewer.model?.speak(audioBuffer, talk, isNeedDecode)
          }
          onComplete?.()
        } catch (error) {
          console.error(
            'An error occurred while processing the speech synthesis task:',
            error
          )
          if (error instanceof Error) {
            console.error('Error details:', error.message)
          }
        }
      }
    }

    this.isProcessing = false
    this.scheduleNeutralExpression()
    if (!hs.chatProcessing) {
      this.clearQueue()
    }
  }

  private async scheduleNeutralExpression() {
    const initialLength = this.queue.length
    await new Promise((resolve) =>
      setTimeout(resolve, SpeakQueue.QUEUE_CHECK_DELAY)
    )

    if (this.shouldResetToNeutral(initialLength)) {
      const hs = homeStore.getState()
      const ss = settingsStore.getState()
      if (ss.modelType === 'live2d') {
        await Live2DHandler.resetToIdle()
      } else {
        await hs.viewer.model?.playEmotion('neutral')
      }
    }
  }

  private shouldResetToNeutral(initialLength: number): boolean {
    return initialLength === 0 && this.queue.length === 0 && !this.isProcessing
  }

  clearQueue() {
    this.queue = []
  }

  checkSessionId(sessionId: string) {
    if (this.currentSessionId !== sessionId) {
      this.currentSessionId = sessionId
      this.clearQueue()
      homeStore.setState({ isSpeaking: true })
    }
  }
}
