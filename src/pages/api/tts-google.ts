import type { NextApiRequest, NextApiResponse } from 'next'
import textToSpeech from '@google-cloud/text-to-speech'
import { google } from '@google-cloud/text-to-speech/build/protos/protos'

type Data = {
  audio?: string | Uint8Array // Base64 encoded string or Uint8Array
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const message = req.body.message
  const ttsType = req.body.ttsType

  try {
    // Check if GOOGLE_TTS_KEY exists
    if (process.env.GOOGLE_TTS_KEY) {
      // Use API Key based authentication
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: { text: message },
            voice: { languageCode: 'ja-JP', name: ttsType },
            audioConfig: { audioEncoding: 'MP3' },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      res.status(200).json({ audio: data.audioContent })
    } else {
      // Use credentials based authentication
      const client = new textToSpeech.TextToSpeechClient()

      const request: google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
        input: { text: message },
        voice: { languageCode: 'ja-JP', name: ttsType },
        audioConfig: { audioEncoding: 'MP3' },
      }

      const [response] = await client.synthesizeSpeech(request)
      const audio = response.audioContent

      // Convert Uint8Array to Base64 if needed
      const audioContent = Buffer.from(audio as Uint8Array).toString('base64')

      res.status(200).json({ audio: audioContent })
    }
  } catch (error) {
    console.error('Error in Google TTS:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
