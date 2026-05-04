import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const clientEnv = readFileSync(resolve(__dirname, '../client.env'), 'utf8')
const token =
  clientEnv.match(/Authirization\s*=\s*["'](.+)["']/)?.[1] ||
  clientEnv.match(/Authorization\s*=\s*["'](.+)["']/)?.[1] ||
  clientEnv.match(/Token\s*=\s*["'](.+)["']/)?.[1] ||
  ''

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_BEARER_TOKEN': JSON.stringify(token),
  },
})
