import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    name: process.env.DB_NAME ?? 'fitness_tracker',
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
  },
}
