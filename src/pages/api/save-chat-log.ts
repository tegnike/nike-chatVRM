import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

// Supabaseクライアントの初期化
let supabase: SupabaseClient | null = null
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { message, isNewFile } = req.body
    const created_at = new Date().toISOString()

    const logsDir = path.join(process.cwd(), 'logs')

    // logsディレクトリが存在しない場合は作成
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir)
    }

    const fileName = isNewFile
      ? `log_${created_at.replace(/[:.]/g, '-')}.json`
      : getLatestLogFile(logsDir)

    const filePath = path.join(logsDir, fileName)

    // ファイルの読み込みと更新
    let messages = []
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      messages = JSON.parse(fileContent)
      if (!Array.isArray(messages)) {
        messages = [messages] // 単一のメッセージの場合は配列に変換
      }
    }
    messages.push(message)

    // 更新されたメッセージ配列を保存
    fs.writeFileSync(filePath, JSON.stringify(messages, null, 2))

    if (supabase) {
      // 既存のセッションを検索
      const { data: existingSession } = await supabase
        .from('local_chat_sessions')
        .select()
        .eq('title', fileName)
        .single()

      let sessionId

      if (existingSession) {
        // 既存のセッションが見つかった場合
        sessionId = existingSession.id

        // updated_at のみ更新
        await supabase
          .from('local_chat_sessions')
          .update({ updated_at: created_at })
          .eq('id', sessionId)
      } else {
        // 新しいセッションを作成
        const { data: newSession, error: sessionError } = await supabase
          .from('local_chat_sessions')
          .insert({
            title: fileName,
            created_at: created_at,
            updated_at: created_at,
          })
          .select()
          .single()

        if (sessionError) throw sessionError
        sessionId = newSession.id
      }

      // 最新のメッセージのみを保存
      const messageToSave = {
        session_id: sessionId,
        role: message.role,
        content: Array.isArray(message.content)
          ? JSON.stringify(message.content)
          : message.content,
        created_at: created_at,
      }

      const { error: messageError } = await supabase
        .from('local_messages')
        .insert(messageToSave)

      if (messageError) throw messageError
    }

    res.status(200).json({ message: 'Log saved successfully' })
  } catch (error) {
    console.error('Error saving chat log:', error)
    res.status(500).json({ message: 'Error saving chat log' })
  }
}

function getLatestLogFile(dir: string): string {
  const files = fs.readdirSync(dir)
  return (
    files.sort().reverse()[0] ||
    `log_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  )
}
