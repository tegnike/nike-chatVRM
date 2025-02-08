# AITuberKit

<img style="max-width: 100%;" src="./logo.png">

**Notice: From version v2.0.0, this project adopts a custom license. If you plan to use it for commercial purposes, please check the [Usage Agreement](#usage-agreement) section.**

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
   <img alt="GitHub Tag" src="https://img.shields.io/github/v/tag/tegnike/aituber-kit?sort=semver&color=orange">
   <a href="https://discord.gg/5rHEue52nZ"><img alt="Discord" src="https://img.shields.io/badge/Discord-AITuberKit-7289DA?logo=discord&style=flat&logoColor=white"/></a>
   <a href="https://github.com/sponsors/tegnike"><img alt="GitHub Sponsor" src="https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=flat&logo=github"/></a>
</p>

<div align="center">
   <h3>
      🌟 <a href="https://aituberkit.com">Demo Site</a> 🌟
   </h3>
</div>

<h3 align="center">
   <a href="../README.md">【Japanese】</a>｜
   <a href="./README_zh.md">【Chinese】</a>｜
   <a href="./README_ko.md">【Korean】</a>
</h3>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=tegnike/aituber-kit&type=Date)](https://star-history.com/#tegnike/aituber-kit&Date)

## Overview

This repository has mainly the following 2 features:

1. Conversation with AI character
2. AITuber streaming

I've written a detailed usage guide in the article below:

[![You are AITuber Developer from Today | Nike-chan](https://github.com/tegnike/aituber-kit/assets/35606144/a958f505-72f9-4665-ab6c-b57b692bb166)](https://note.com/nike_cha_n/n/ne98acb25e00f)

## ⚠️ Important Security Notice

This repository is designed for personal use, local development, and commercial use with appropriate security measures. However, please note the following points when deploying to a web environment:

- **API Key Handling**: Since the specification requires API calls to AI services (OpenAI, Anthropic, etc.) and TTS services through a backend server, proper management of API keys is necessary.

### Regarding Production Environment Usage

When using in a production environment, we recommend one of the following approaches:

1. **Backend Server Implementation**: Manage API keys on the server side and avoid direct API access from clients
2. **Proper User Instructions**: When users use their own API keys, explain the security considerations
3. **Access Control Implementation**: Implement appropriate authentication and authorization mechanisms as needed

## Development Environment

This project is developed in the following environment:

- Node.js: ^20.0.0
- npm: 10.8.1

## Common Preparations

1. Clone the repository to your local machine.

```bash
git clone https://github.com/tegnike/aituber-kit.git
```

2. Open the folder.

```bash
cd aituber-kit
```

3. Install packages.

```bash
npm install
```

4. Start the application in development mode.

```bash
npm run dev
```

5. Open the URL [http://localhost:3000](http://localhost:3000)

6. Create the .env file if necessary.

```bash
cp .env.example .env
```

## Conversation with AI Character

- This is a feature to converse with an AI character.
- It is an extended feature of [pixiv/ChatVRM](https://github.com/pixiv/ChatVRM), which is the basis of this repository.
- It can be easily started as long as you have an API key for various LLMs.
- The recent conversation sentences are retained as memory.
- It is multimodal, capable of recognizing images from the camera or uploaded images to generate responses.

### Usage

1. Enter your API key for various LLMs in the settings screen.
   - OpenAI
   - Anthropic
   - Google Gemini
   - Azure OpenAI
   - Groq
   - Cohere
   - Mistral AI
   - Perplexity
   - Fireworks
   - Local LLM
   - Dify (Chatbot or Agent)
2. Edit the character's setting prompt if necessary.
3. Load a VRM file or Live2D file, and background file if needed.
4. Select a speech synthesis engine and configure voice settings if necessary.
   - VOICEVOX: You can select a speaker from multiple options. The VOICEVOX app needs to be running beforehand.
   - Koeiromap: You can finely adjust the voice. An API key is required.
   - Google TTS: Languages other than Japanese can also be selected. Credential information is required.
   - Style-Bert-VITS2: A local API server needs to be running.
   - AivisSpeech: The AivisSpeech app needs to be running beforehand.
   - GSVI TTS: A local API server needs to be running.
   - ElevenLabs: Various language selection is possible. Please enter the API key.
   - OpenAI: API key is required.
   - Azure OpenAI: API key is required.
   - Nijivoice: API key is required.
5. Start conversing with the character from the input form. Microphone input is also possible.

## AITuber Streaming

- It is possible to retrieve YouTube streaming comments and have the character speak.
- A YouTube API key is required.
- Comments starting with '#' are not read.

### Usage

1. Turn on YouTube mode in the settings screen.
2. Enter your YouTube API key and YouTube Live ID.
3. Configure other settings the same way as "Conversation with AI Character".
4. Start streaming on YouTube and confirm that the character reacts to comments.
5. Turn on the conversation continuity mode to be able to speak even if there are no comments.

## Other Features

### External Linkage Mode

- You can send requests to the server app via WebSocket and get responses.
- A separate server app needs to be prepared.

#### Usage

1. Start the server app and open the `ws://127.0.0.1:8000/ws` endpoint.
2. Turn on External Linkage Mode in the settings screen.
3. Configure other settings the same way as "Conversation with AI Character".
4. Send requests from the input form and confirm that responses are returned from the server app.

#### Related

- You can try it immediately with this server app repository. [tegnike/aituber-server](https://github.com/tegnike/aituber-server)
- For detailed settings, please read "[Let's develop with a beautiful girl!! [Open Interpreter]](https://note.com/nike_cha_n/n/nabcfeb7aaf3f)".

### Slide Mode

- This is a mode where the AI character automatically presents slides.
- You need to prepare slides and script files in advance.

#### Usage

1. Proceed to the point where you can interact with the AI character.
2. Place the slide folder and script file in the designated folder.
3. Turn on Slide Mode in the settings screen.
4. Press the Start Slide button to begin the presentation.

#### Related

- For detailed settings, please read "[AI Does Slide Presentations Now!!!!](https://note.com/nike_cha_n/n/n867081a598f1)".

### Realtime API Mode

- This is a mode where you can interact with the character with low latency using OpenAI's Realtime API.
- Function execution can be defined.

#### Usage

1. Select OpenAI or Azure OpenAI as the AI service.
2. Turn on Realtime API mode.
3. Use the microphone to talk to the character.

#### Function Execution

- Define new functions in src/components/realtimeAPITools.tsx and src/components/realtimeAPITools.json.
- Refer to the existing get_current_weather function as an example.

## TIPS

### Live2D Specifications

We use the unofficial library [pixi-live2d-display](https://github.com/RaSan147/pixi-live2d-display) for Live2D display.

Live2D provides a library called Cubism as a development SDK, and currently there are Cubism 2.1, Cubism 3, Cubism 4, and Cubism 5. Cubism 4 is compatible with Cubism 3 models, and the latest Cubism 5 is compatible with Cubism 4.

By using Cubism 2.1 and Cubism 4/5, we support all variants of Live2D models.

#### Cubism Core

Before using this feature, you need to set the following Cubism Core (Cubism runtime library) files in both `public/scripts`:

1. `live2dcubismcore.min.js` (Cubism 4/5)

   - [Official website](https://www.live2d.com/sdk/download/web/)
   - [Alternative](https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js) (Note: Not recommended for production use)

2. `live2d.min.js` (Cubism 2.1)
   - Since September 4, 2019, the official website no longer allows downloads, but it is available from:
     - GitHub: [dylanNew/live2d](https://github.com/dylanNew/live2d/tree/master/webgl/Live2D/lib)
     - CDN: https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js

By setting both files, you can support all versions of Live2D models.

### Background Image Setting

- Change the background image at `public/bg-c.png`. Do not change the name.

### Setting Environment Variables

- Some configuration values can be referenced from the `.env` file contents.
- If entered in the settings screen, that value takes precedence.

### Microphone Input Methods (2 Patterns)

1. Hold Alt (or option) key to record => Release to send
2. Click microphone button (click once to start recording) => Click again to send

### Other

- Settings and conversation history can be reset in the settings screen.
- Various settings are stored in the browser's local storage.
- Elements enclosed in code blocks are not read by TTS.

## Related Articles

- [You are AITuber Developer from Today | Nike-chan](https://note.com/nike_cha_n/n/ne98acb25e00f)
- [Let's develop with a beautiful girl!! [Open Interpreter]](https://note.com/nike_cha_n/n/nabcfeb7aaf3f)
- [AI Does Slide Presentations Now!!!!](https://note.com/nike_cha_n/n/n867081a598f1)
- [Added Multimodal Features to AITuberKit, So Let's Have a Drink at Home with AI Character](https://note.com/nike_cha_n/n/n6d8e330561e4)
- [AITuberKit × Dify for Super Easy Chatbot Building](https://note.com/nike_cha_n/n/n13cd8b3cf88a)
- [Publishing Dify on the Internet with Xserver](https://note.com/nike_cha_n/n/n23467824b22b)
- [Try the Advanced Voice Mode Called Realtime API](https://note.com/nike_cha_n/n/ne51c16ddadd0)

## Seeking Sponsors

We are seeking sponsors to continue our development efforts.<br>
Your support will greatly contribute to the development and improvement of the AITuber Kit.

[![GitHub Sponsor](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=for-the-badge&logo=github)](https://github.com/sponsors/tegnike)

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/fdanv1k6iz)

### Our Supporters (in order of support)

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

Plus multiple private sponsors

## Usage Agreement

### License

From version v2.0.0, this project adopts a **custom license**.

- **Non-Commercial Use**

  - Non-Commercial Use is available for personal use, educational purposes, and non-profit purposes that are not for commercial purposes.

- **Commercial License**
  - A separate commercial license is required for commercial use.
  - For details, please check [About License](./license_en.md).

## Priority Implementation

This project accepts paid priority implementation requests.

- You can prioritize the implementation of features requested by companies or individuals.
- The implemented features will be part of this OSS project.
- The fee will be estimated individually depending on the complexity and time required for implementation.
- This priority implementation is a separate initiative from the commercial license. If you want to use the implemented features commercially, you need to obtain a separate commercial license.

For details, please contact support@aituberkit.com.

### Others

- [Logo Usage Agreement](./logo_licence_en.md)
- [VRM and Live2D Model Usage Agreement](./character_model_licence_en.md)
