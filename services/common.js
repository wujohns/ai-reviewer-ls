const path = require('path')
const dotenv = require("dotenv")
const { Anthropic } = require('@anthropic-ai/sdk');
dotenv.config({ path: path.join(__dirname, '../.env') })

const client = new Anthropic({
  baseURL: process.env.ANTHROPIC_API_BASE_URL,
  apiKey: process.env.ANTHROPIC_API_KEY
})

async function chat () {
  const message = await client.beta.messages.create({
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello, Claude' }],
    model: 'claude-sonnet-4-5-20250929',
  });

  console.log(message.content)
}

async function chatWithTool (prompt, tools, schema) {
  const message = await client.beta.messages.toolRunner({
    max_tokens: 10240,
    messages: [{ role: 'user', content: prompt }],
    betas: ["structured-outputs-2025-11-13"],
    // model: 'claude-haiku-4-5-20251001',
    model: 'claude-sonnet-4-5-20250929',
    tools: tools,
    output_format: {
      type: 'json_schema',
      schema
    },
  });

  return message.content
}

module.exports = {
  chatWithTool
}
