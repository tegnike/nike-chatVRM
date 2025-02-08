# AITuberKit

<img style="max-width: 100%;" src="./docs/logo.png">

**お知らせ: 本プロジェクトはバージョン v2.0.0 以降、カスタムライセンスを採用しています。商用目的でご利用の場合は、[利用規約](#利用規約) セクションをご確認ください。**

<p align="center">
   <a href="https://github.com/tegnike/aituber-kit"><img alt="GitHub Last Commit" src="https://img.shields.io/github/last-commit/tegnike/aituber-kit"></a>
   <a href="https://github.com/tegnike/aituber-kit"><img alt="GitHub Top Language" src="https://img.shields.io/github/languages/top/tegnike/aituber-kit"></a>
   <img alt="GitHub Tag" src="https://img.shields.io/github/v/tag/tegnike/aituber-kit?sort=semver&color=orange">
   <a href="https://github.com/tegnike/aituber-kit/blob/main/LICENSE"><img alt="License: Custom" src="https://img.shields.io/badge/License-Custom-blue"></a>
</p>
<p align="center">
   <a href="https://github.com/tegnike/aituber-kit/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/tegnike/aituber-kit"></a>
   <a href="https://github.com/tegnike/aituber-kit/network/members"><img alt="GitHub forks" src="https://img.shields.io/github/forks/tegnike/aituber-kit"></a>
   <a href="https://github.com/tegnike/aituber-kit/graphs/contributors"><img alt="GitHub contributors" src="https://img.shields.io/github/contributors/tegnike/aituber-kit"></a>
   <a href="https://github.com/tegnike/aituber-kit/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/tegnike/aituber-kit"></a>
</p>
<p align="center">
   <a href="https://x.com/tegnike"><img alt="X (Twitter)" src="https://img.shields.io/badge/X-tegnike-1DA1F2?logo=x&style=flat&logoColor=white"/></a>
   <a href="https://discord.gg/5rHEue52nZ"><img alt="Discord" src="https://img.shields.io/badge/Discord-AITuberKit-7289DA?logo=discord&style=flat&logoColor=white"/></a>
   <a href="https://github.com/sponsors/tegnike"><img alt="GitHub Sponsor" src="https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=flat&logo=github"/></a>
</p>

<div align="center">
   <h3>
      🌟 <a href="https://aituberkit.com">デモサイトへ</a> 🌟
   </h3>
</div>

<h3 align="center">
   <a href="./docs/README_en.md">English</a>｜
   <a href="./docs/README_zh.md">中文</a>｜
   <a href="./docs/README_ko.md">韓語</a>
</h3>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=tegnike/aituber-kit&type=Date)](https://star-history.com/#tegnike/aituber-kit&Date)

## 概要

主に以下の2つの機能があります。

1. AIキャラとの対話
2. AITuber配信

下記の記事に詳細な使用方法を記載しました。

[![今日からあなたもAITuberデベロッパー｜ニケちゃん](https://github.com/tegnike/aituber-kit/assets/35606144/a958f505-72f9-4665-ab6c-b57b692bb166)](https://note.com/nike_cha_n/n/ne98acb25e00f)

## ⚠️ セキュリティに関する重要な注意事項

このリポジトリは、個人利用やローカル環境での開発はもちろん、適切なセキュリティ対策を施した上での商用利用も想定しています。ただし、Web環境にデプロイする際は以下の点にご注意ください：

- **APIキーの取り扱い**: バックエンドサーバーを経由してAIサービス（OpenAI, Anthropic等）やTTSサービスのAPIを呼び出す仕様となっているため、APIキーの適切な管理が必要です。

### 本番環境での利用について

本番環境で利用する場合は、以下のいずれかの対応を推奨します：

1. **バックエンドサーバーの実装**: APIキーの管理をサーバーサイドで行い、クライアントからの直接的なAPIアクセスを避ける
2. **利用者への適切な説明**: 各利用者が自身のAPIキーを使用する場合は、セキュリティ上の注意点について説明する
3. **アクセス制限の実装**: 必要に応じて、適切な認証・認可の仕組みを実装する

## 開発環境

このプロジェクトは以下の環境で開発されています：

- Node.js: ^20.0.0
- npm: 10.8.1

## 共通事前準備

1. リポジトリをローカルにクローンします。

```bash
git clone https://github.com/tegnike/aituber-kit.git
```

2. フォルダを開きます。

```bash
cd aituber-kit
```

3. パッケージインストールします。

```bash
npm install
```

4. 開発モードでアプリケーションを起動します。

```bash
npm run dev
```

5. URLを開きます。[http://localhost:3000](http://localhost:3000)

6. 必要に応じて.envファイルを作成します。

```bash
cp .env.example .env
```

## AIキャラとの対話

- AIキャラと会話する機能です。
- このリポジトリの元になっている [pixiv/ChatVRM](https://github.com/pixiv/ChatVRM) を拡張した機能です。
- 各種LLMのAPIキーさえあれば簡単に始めることが可能です。
- 直近の会話文を記憶として保持します。
- マルチモーダルで、カメラからの映像やアップロードした画像を認識して回答を生成することが可能です。

### 使用方法

1. 設定画面で選択したLLMのAPIキーを入力します。
   - OpenAI
   - Anthropic
   - Google Gemini
   - Azure OpenAI
   - Groq
   - Cohere
   - Mistral AI
   - Perplexity
   - Fireworks
   - ローカルLLM
   - Dify（Chatbot or Agent）
2. 必要に応じてキャラクターの設定プロンプトを編集します。
3. 必要に応じてキャラクターのVRMファイルまたはLive2Dファイル、および背景ファイルをアップロードします。
4. 音声合成エンジンを選択し、必要に応じて声の設定を行います。
   - VOICEVOX: 複数の選択肢から話者を選ぶことができます。予めVOICEVOXアプリを起動しておく必要があります。
   - Koeiromap: 細かく音声を調整することが可能です。APIキーの入力が必要です。
   - Google TTS: 日本語以外の言語も選択可能です。credential情報が必要です。
   - Style-Bert-VITS2: ローカルAPIサーバーを起動しておく必要があります。
   - AivisSpeech: 予めAivisSpeechアプリを起動しておく必要があります。
   - GSVI TTS: ローカルAPIサーバーを起動しておく必要があります。
   - ElevenLabs: 様々な言語の選択が可能です。APIキーの入力が必要です。
   - OpenAI: APIキーの入力が必要です。
   - Azure OpenAI: APIキーの入力が必要です。
   - にじボイス: APIキーの入力が必要です。
5. 入力フォームからキャラクターと会話を開始します。マイク入力も可能です。

## AITuber配信

- Youtubeの配信コメントを取得して発言することが可能です。
- Youtube APIキーが必要です。
- "#"から始まるコメントは読まれません。

### 使用方法

1. 設定画面でYoutubeモードをONにします。
2. Youtube APIキーとYoutube Live IDを入力します。
3. 他の設定は"AIキャラとの対話"と同様に行います。
4. Youtubeの配信を開始し、キャラクターがコメントに反応するのを確認します。
5. 会話継続モードをONにすると、コメントが無いときにAIが自ら発言することができます。

## その他の機能

### 外部連携モード

- WebSocketでサーバーアプリにリクエストを送信して、レスポンスを取得することができます。
- 別途サーバーアプリを用意する必要があります。

#### 使用方法

1. サーバーアプリを起動し、`ws://127.0.0.1:8000/ws` エンドポイントを開きます。
2. 設定画面で外部連携モードをONにします。
3. 他の設定は"AIキャラとの対話"と同様に行います。
4. 入力フォームからリクエストを送信し、サーバーアプリからのリクエストが返却されるのを確認します。

#### 関連

- こちらのサーバーアプリのリポジトリですぐに試すことが可能です。[tegnike/aituber-server](https://github.com/tegnike/aituber-server)
- 詳しい設定は"[美少女と一緒に開発しようぜ！！【Open Interpreter】](https://note.com/nike_cha_n/n/nabcfeb7aaf3f)"をお読みください。

### スライドモード

- スライドをAIキャラが自動で発表するモードです。
- 予めスライドと台本ファイルを用意しておく必要があります。

#### 使用方法

1. AIキャラと対話できるところまで進めておきます。
2. スライドフォルダと台本ファイルを指定のフォルダに配置します。
3. 設定画面でスライドモードをONにします。
4. スライド開始ボタンを押して発表を開始します。

#### 関連

- 詳しい設定は"[スライド発表はAIがやる時代！！！！](https://note.com/nike_cha_n/n/n867081a598f1)"をお読みください。

### Realtime APIモード

- OpenAIのRealtime APIを使用して、低遅延でキャラと対話できるモードです。
- 関数実行を定義することができます。

#### 使用方法

1. AIサービスでOpenAIまたはAzure OpenAIを選択します。
2. Realtime APIモードをONにします。
3. マイクを使用して話しかけます。

#### 関数実行

- src/components/realtimeAPITools.tsx, src/components/realtimeAPITools.json に新しい関数を定義します。
- 既存の get_current_weather 関数を参考にしてください。

## TIPS

### Live2Dの仕様に際して

Live2D表示のために非公式ライブラリの [pixi-live2d-display](https://github.com/RaSan147/pixi-live2d-display) を使用しています。

Live2Dは開発用SDKとしてCubismというライブラリが提供されており、現在Cubism 2.1、Cubism 3、Cubism 4、そしてCubism 5が存在します。Cubism 4はCubism 3のモデルと互換性があり、最新のCubism 5はCubism 4と互換性があります。

Cubism 2.1とCubism 4/5を使用することで、すべてのバリアントのLive2Dモデルをサポートしています。

#### Cubism Core

この機能を利用する前に、以下のCubism Core（Cubismランタイムライブラリ）ファイルを両方とも `public/scripts` に設置する必要があります：

1. `live2dcubismcore.min.js`（Cubism 4/5用）

   - [公式サイト](https://www.live2d.com/sdk/download/web/)からダウンロード可能
   - または[こちら](https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js)から入手可能（注：本番環境での使用は推奨されません）

2. `live2d.min.js`（Cubism 2.1用）
   - 2019年9月4日以降、公式サイトからはダウンロードできなくなっていますが、以下から入手可能：
     - GitHub: [dylanNew/live2d](https://github.com/dylanNew/live2d/tree/master/webgl/Live2D/lib)
     - CDN: https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js

両方のファイルを設置することで、すべてのバージョンのLive2Dモデルをサポートすることができます。

### 背景画像の設定

- 背景画像は `public/bg-c.png` の画像を変更してください。名称は変更しないでください。

### 環境変数の設定

- 一部の設定値は `.env` ファイルの内容を参照することができます。
- 設定画面で入力した場合は、環境変数で指定された値よりも優先されます。

### マイク入力方法（2パターン）

1. Alt (or option) キーを押している間入力受付 => 離したら送信
2. マイクボタンをクリック（一度押したら入力受付）=> もう一度クリックで送信

### その他

- 設定情報・会話履歴は設定画面でリセットすることができます。
- 各種設定項目はブラウザにローカルストレージとして保存されます。
- コードブロックで囲まれた要素はTTSで読まれません。

## 関連記事

- [今日からあなたもAITuberデベロッパー｜ニケちゃん](https://note.com/nike_cha_n/n/ne98acb25e00f)
- [美少女と一緒に開発しようぜ！！【Open Interpreter】](https://note.com/nike_cha_n/n/nabcfeb7aaf3f)
- [スライド発表はAIがやる時代！！！！](https://note.com/nike_cha_n/n/n867081a598f1)
- [AITuberKitにマルチモーダル機能を追加したのでAIキャラと宅飲みしてみる](https://note.com/nike_cha_n/n/n6d8e330561e4)
- [AITuberKit × Dify で超簡単チャットボット構築](https://note.com/nike_cha_n/n/n13cd8b3cf88a)
- [DifyをXserverでインターネットに公開する](https://note.com/nike_cha_n/n/n23467824b22b)
- [高度な音声モード こと Realtime API を試してみる](https://note.com/nike_cha_n/n/ne51c16ddadd0)

## スポンサー募集

開発を継続するためにスポンサーの方を募集しています。<br>
あなたの支援は、AITuberキットの開発と改善に大きく貢献します。

[![GitHub Sponsor](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=for-the-badge&logo=github)](https://github.com/sponsors/tegnike)

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/fdanv1k6iz)

### 協力者の皆様（ご支援いただいた順）

<p>
  <a href="https://github.com/morioki3" title="morioki3">
    <img src="https://github.com/morioki3.png" width="40" height="40" alt="morioki3">
  </a>
  <a href="https://github.com/hodachi-axcxept" title="hodachi-axcxept">
    <img src="https://github.com/hodachi-axcxept.png" width="40" height="40" alt="hodachi-axcxept">
  </a>
  <a href="https://github.com/coderabbitai" title="coderabbitai">
    <img src="https://github.com/coderabbitai.png" width="40" height="40" alt="coderabbitai">
  </a>
  <a href="https://github.com/ai-bootcamp-tokyo" title="ai-bootcamp-tokyo">
    <img src="https://github.com/ai-bootcamp-tokyo.png" width="40" height="40" alt="ai-bootcamp-tokyo">
  </a>
  <a href="https://github.com/wmoto-ai" title="wmoto-ai">
    <img src="https://github.com/wmoto-ai.png" width="40" height="40" alt="wmoto-ai">
  </a>
  <a href="https://github.com/JunzoKamahara" title="JunzoKamahara">
    <img src="https://github.com/JunzoKamahara.png" width="40" height="40" alt="JunzoKamahara">
  </a>
  <a href="https://github.com/darkgaldragon" title="darkgaldragon">
    <img src="https://github.com/darkgaldragon.png" width="40" height="40" alt="darkgaldragon">
  </a>
  <a href="https://github.com/usagi917" title="usagi917">
    <img src="https://github.com/usagi917.png" width="40" height="40" alt="usagi917">
  </a>
  <a href="https://github.com/ochisamu" title="ochisamu">
    <img src="https://github.com/ochisamu.png" width="40" height="40" alt="ochisamu">
  </a>
  <a href="https://github.com/mo0013" title="mo0013">
    <img src="https://github.com/mo0013.png" width="40" height="40" alt="mo0013">
  </a>
  <a href="https://github.com/tsubouchi" title="tsubouchi">
    <img src="https://github.com/tsubouchi.png" width="40" height="40" alt="tsubouchi">
  </a>
  <a href="https://github.com/bunkaich" title="bunkaich">
    <img src="https://github.com/bunkaich.png" width="40" height="40" alt="bunkaich">
  </a>
  <a href="https://github.com/seiki-aliveland" title="seiki-aliveland">
    <img src="https://github.com/seiki-aliveland.png" width="40" height="40" alt="seiki-aliveland">
  </a>
  <a href="https://github.com/rossy8417" title="rossy8417">
    <img src="https://github.com/rossy8417.png" width="40" height="40" alt="rossy8417">
  </a>
  <a href="https://github.com/gijigae" title="gijigae">
    <img src="https://github.com/gijigae.png" width="40" height="40" alt="gijigae">
  </a>
  <a href="https://github.com/takm-reason" title="takm-reason">
    <img src="https://github.com/takm-reason.png" width="40" height="40" alt="takm-reason">
  </a>
  <a href="https://github.com/haoling" title="haoling">
    <img src="https://github.com/haoling.png" width="40" height="40" alt="haoling">
  </a>
  <a href="https://github.com/FoundD-oka" title="FoundD-oka">
    <img src="https://github.com/FoundD-oka.png" width="40" height="40" alt="FoundD-oka">
  </a>
  <a href="https://github.com/terisuke" title="terisuke">
    <img src="https://github.com/terisuke.png" width="40" height="40" alt="terisuke">
  </a>
  <a href="https://github.com/konpeita" title="konpeita">
    <img src="https://github.com/konpeita.png" width="40" height="40" alt="konpeita">
  </a>
  <a href="https://github.com/MojaX2" title="MojaX2">
    <img src="https://github.com/MojaX2.png" width="40" height="40" alt="MojaX2">
  </a>
</p>

他、プライベートスポンサー 複数名

## 利用規約

### ライセンス

本プロジェクトは、バージョン v2.0.0 以降、**カスタムライセンス**を採用しています。

- **無償利用**

  - 営利目的以外での個人利用、教育目的、非営利目的での使用は無償で利用可能です。

- **商用ライセンス**
  - 商用目的での使用に関しては、別途商用ライセンスの取得が必要です。
  - 詳細は、[ライセンスについて](./docs/license.md)をご確認ください。

## 優先実装について

本プロジェクトでは、有償での機能優先実装を受け付けています。

- 企業や個人の方から要望のあった機能を、優先的に実装することが可能です。
- 実装された機能は、本OSSプロジェクトの一部として公開されます。
- 料金は機能の複雑さや実装に要する時間に応じて個別見積もりとなります。
- この優先実装は商用ライセンスとは別の取り組みです。実装された機能を商用利用する場合は、別途商用ライセンスの取得が必要です。

詳細については、support@aituberkit.com までお問い合わせください。

### その他

- [ロゴの利用規約](./docs/logo_licence.md)
- [VRMおよびLive2Dモデルの利用規約](./docs/character_model_licence.md)
