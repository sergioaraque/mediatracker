import { Client, Account, Databases, Storage, Query, ID, Permission, Role } from 'appwrite'

declare global {
  interface Window {
    __APP_CONFIG__?: { endpoint: string; projectId: string }
  }
}

const endpoint  = window.__APP_CONFIG__?.endpoint  || import.meta.env.VITE_APPWRITE_ENDPOINT  || ''
const projectId = window.__APP_CONFIG__?.projectId || import.meta.env.VITE_APPWRITE_PROJECT_ID || ''

if (!endpoint || !projectId) {
  console.error(
    '[MediaLog] Falta configuración de Appwrite.\n' +
    '  Dev: crea src/.env.local con VITE_APPWRITE_ENDPOINT y VITE_APPWRITE_PROJECT_ID, luego reinicia Vite.\n' +
    '  Prod: arranca el contenedor con las variables APPWRITE_ENDPOINT y APPWRITE_PROJECT_ID.'
  )
}

export const client = new Client()
if (endpoint)  client.setEndpoint(endpoint)
if (projectId) client.setProject(projectId)

export const account   = new Account(client)
export const databases = new Databases(client)
export const storage   = new Storage(client)

export const DB_ID               = '69c99f5d001818bd3ae2'
export const COLL_MEDIA          = '69c99f6d00341a9e5402'
export const COLL_PROGRESS       = '69c9a0240036e02beb60'
export const COLL_STATUS_HISTORY = 'status_history'
export const BUCKET_COVERS       = 'covers'

export { Query, ID, Permission, Role }
