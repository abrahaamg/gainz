import { defineConfig } from 'vitest/config'

/**
 * Tests de integración contra un MySQL real (pnpm test:integration).
 *
 * Siempre usan la BD fitness_tracker_test, que se borra y se vuelve a montar
 * con las migraciones y los seeds en cada ejecución. El resto de la conexión
 * (host, usuario, contraseña) sale del .env como en desarrollo. Si no hay
 * MySQL accesible, los tests se saltan en vez de fallar.
 */
const TEST_DB_NAME = 'fitness_tracker_test'

// El globalSetup corre en este proceso; los tests, en workers que reciben `env`
process.env.DB_NAME = TEST_DB_NAME
process.env.NODE_ENV = 'test'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/test/integration/**/*.test.ts'],
    globalSetup: ['src/test/integration/globalSetup.ts'],
    env: { DB_NAME: TEST_DB_NAME, NODE_ENV: 'test' },
    // Comparten BD: un fichero detrás de otro
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 120000,
  },
})
