import * as admin from 'firebase-admin'

if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    } as admin.ServiceAccount),
  })
}

export const verifyIdToken = (token: string): Promise<admin.auth.DecodedIdToken> =>
  admin.auth().verifyIdToken(token)
