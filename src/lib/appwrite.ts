import { Client, Account, Databases, Storage, Query, ID, Permission, Role } from 'appwrite'

const endpoint  = import.meta.env.VITE_APPWRITE_ENDPOINT  as string || ''
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string || ''
const dbId      = import.meta.env.VITE_APPWRITE_DB_ID as string || ''
const collMedia = import.meta.env.VITE_APPWRITE_COLL_MEDIA as string || ''
const collProgress = import.meta.env.VITE_APPWRITE_COLL_PROGRESS as string || ''
const collStatusHistory = import.meta.env.VITE_APPWRITE_COLL_STATUS_HISTORY as string || ''
const bucketCovers = import.meta.env.VITE_APPWRITE_BUCKET_COVERS as string || ''

export const hasAppwriteDatabaseConfig = Boolean(dbId && collMedia && collProgress && collStatusHistory && bucketCovers)

if (!endpoint || !projectId) {
  console.error('[MediaTracker] Falta configuración. Añade VITE_APPWRITE_ENDPOINT y VITE_APPWRITE_PROJECT_ID en Coolify (o en .env.local para desarrollo).')
}

if (!dbId || !collMedia || !collProgress || !collStatusHistory || !bucketCovers) {
  console.error('[MediaTracker] Falta configuración de colecciones. Añade VITE_APPWRITE_DB_ID, VITE_APPWRITE_COLL_MEDIA, VITE_APPWRITE_COLL_PROGRESS, VITE_APPWRITE_COLL_STATUS_HISTORY y VITE_APPWRITE_BUCKET_COVERS.')
}

export function getMissingAppwriteDatabaseConfigMessage() {
  return 'Falta configuración de Appwrite. Revisa VITE_APPWRITE_DB_ID, VITE_APPWRITE_COLL_MEDIA, VITE_APPWRITE_COLL_PROGRESS, VITE_APPWRITE_COLL_STATUS_HISTORY y VITE_APPWRITE_BUCKET_COVERS.'
}

export const client = new Client()
if (endpoint)  client.setEndpoint(endpoint)
if (projectId) client.setProject(projectId)

export const account   = new Account(client)
export const databases = new Databases(client)
export const storage   = new Storage(client)

export const DB_ID               = dbId
export const COLL_MEDIA          = collMedia
export const COLL_PROGRESS       = collProgress
export const COLL_STATUS_HISTORY = collStatusHistory
export const BUCKET_COVERS       = bucketCovers

export { Query, ID, Permission, Role }
