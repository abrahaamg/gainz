import app from './app'
import { config, checkDatabaseConnection } from './config'

const start = async (): Promise<void> => {
  // Verify DB connection on startup
  const dbConnected = await checkDatabaseConnection()
  if (!dbConnected) {
    console.error('❌ Could not connect to MySQL. Check your .env settings.')
    process.exit(1)
  }
  console.log('✅ MySQL connected')

  app.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`)
    console.log(`📋 Health check: http://localhost:${config.port}/health`)
    console.log(`🌍 Environment: ${config.nodeEnv}`)
  })
}

start()
