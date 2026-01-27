# Letter to You

A guided reflection tool that walks users through thoughtful questions, then generates a personalized letter synthesizing their responses.

## What It Is

* **Not therapy.** Not diagnosis. Not crisis support.
* **Guided self-reflection** + narrative synthesis
* Takes 10-15 minutes
* Outputs a single letter (600-1,200 words) with specific reflections and 2-4 concrete next steps

## Tech Stack

* **Frontend:** Vite + React
* **Backend:** Netlify Functions
* **AI:** Claude API (Anthropic)
* **Hosting:** Netlify

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file (or set in Netlify dashboard):

```
ANTHROPIC_API_KEY=your_api_key_here
```

### 3. Run locally

```bash
npm run dev
```

For the Netlify functions to work locally, use:

```bash
npx netlify dev
```

### 4. Deploy to Netlify

1. Push to GitHub
2. Connect repo to Netlify
3. Add `ANTHROPIC_API_KEY` to Environment Variables in Netlify dashboard
4. Deploy

## Project Structure

```
letter-to-you/
├── config/
│   └── questions.js      # Question bank + safety config
├── netlify/
│   └── functions/
│       └── generate-letter.js  # Claude API call
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx           # Main React component
│   ├── main.jsx          # Entry point
│   └── styles.css        # All styling
├── index.html
├── netlify.toml
├── package.json
└── vite.config.js
```

## Modes

* **General Reflection** - broad exploration
* **Relationship & Connection** - patterns in relating to others
* **Career & Meaning** - work, purpose, what you're building
* **Transition / Crossroads** - between chapters

Each mode loads a different subset of questions.

## Safety

The app includes:
* Client-side safety keyword detection
* Crisis resource display with international helplines
* Letter generation is blocked if safety content is detected

## License

MIT
