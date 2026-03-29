import { Client, Account, Databases, Storage, Query, ID, Permission, Role } from 'appwrite'

declare global {
  interface Window {
    __APP_CONFIG__?: { endpoint: string; projectId: string }
  }
}

const endpoint  = window.__APP_CONFIG__?.endpoint  || import.meta.env.VITE_APPWRITE_ENDPOINT  || ''
const projectId = window.__APP_CONFIG__?.projectId || import.meta.env.VITE_APPWRITE_PROJECT_ID || ''

export const client = new Client().setEndpoint(endpoint).setProject(projectId)

export const account   = new Account(client)
export const databases = new Databases(client)
export const storage   = new Storage(client)

export const DB_ID         = '69c99f5d001818bd3ae2'
export const COLL_MEDIA    = '69c99f6d00341a9e5402'
export const COLL_PROGRESS = '69c9a0240036e02beb60'
export const BUCKET_COVERS = 'covers'

export { Query, ID, Permission, Role }
