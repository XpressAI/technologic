# Tree Chat GPT

Tree Chat GPT is a web application that uses OpenAI's GPT-3.5 to generate forking conversations;

## Installation

Clone the repository and navigate to the project directory:

```
git clone https://github.com/XpressAI/tree-chat-gpt.git
cd tree-chat-gpt
```

Install the dependencies:

```
npm install
```

## Configuration

Create a `.env` file in the project root directory with the following variables:

```
OPENAI_API_KEY=<your_openai_api_key>
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
