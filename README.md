
# 文言尺牍 (Ink & Epistle)

**“以古文之雅，练当代之表达；以尺牍为器，习一生可用的文辞力。”**

A structured, immersive platform for mastering Classical Chinese epistolary writing, featuring AI-powered drafting, template libraries, and progress tracking.

## Features

- **尺牍模版 (Template Library)**: Ready-to-use frameworks for various occasions (Greetings, Apologies, Gratitude, etc.).
- **辞藻典库 (Phrase Atlas)**: A dictionary of classical vocabulary and sentence patterns.
- **习练工坊 (Practice Studio)**: Quizzes and exercises to test your knowledge.
- **挥毫更张 (Writing Editor)**: AI-assisted editor with polishing, translation, and rhythm analysis tools.
- **古人投壶 (Simulator)**: Simulate correspondence with historical figures like Su Shi and Li Qingzhao.
- **七日特训 (Bootcamp)**: A structured 7-day course to master the basics.
- **剧情尺牍 (Story Mode)**: Role-playing scenarios to practice writing in context.
- **书简体验馆 (Letter Museum)**: Study classic masterpieces with annotations and analysis.
- **文言导师 (AI Tutor)**: A personalized AI coach for style and grammar advice.
- **文友圈 (Community)**: Share your works and interact with other scholars.
- **印章工坊 (Seal Studio)**: Design your own digital seal to stamp on your works.
- **飞花令 (Flying Flower)**: A poetry game to challenge your memory and vocabulary.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **AI**: Google Gemini API
- **Backend/Auth**: Supabase
- **Visualization**: Recharts
- **Utils**: html2canvas (Image generation)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment Variables:
   Create a `.env` file in the root directory and add:
   ```
   VITE_GOOGLE_API_KEY=your_gemini_api_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run locally:
   ```bash
   npm run dev
   ```

## License

MIT
