import { config } from '../config'
import { openMigrationConnection, runPending, SqlKind } from './migrator'

/**
 * Uso:
 *   pnpm db:migrate               aplica las migraciones pendientes
 *   pnpm db:migrate --baseline    las registra como aplicadas sin ejecutarlas
 *   pnpm db:seed [--baseline]     lo mismo con los seeds
 *   pnpm db:setup                 migraciones + seeds (BD vacía)
 */
const COMMANDS: Record<string, SqlKind[]> = {
  migrate: ['migrations'],
  seed: ['seeds'],
  setup: ['migrations', 'seeds'],
}

const main = async (): Promise<void> => {
  const [command, ...flags] = process.argv.slice(2)
  const kinds = COMMANDS[command]
  if (!kinds) {
    throw new Error(`Comando desconocido "${command ?? ''}". Usa: migrate | seed | setup [--baseline]`)
  }
  const baseline = flags.includes('--baseline')

  console.log(`BD: ${config.db.name} en ${config.db.host}:${config.db.port}${baseline ? ' (baseline)' : ''}`)
  const conn = await openMigrationConnection()
  try {
    for (const kind of kinds) {
      await runPending(conn, kind, { baseline, log: (message) => console.log(message) })
    }
  } finally {
    await conn.end()
  }
}

main().catch((err: Error) => {
  console.error(err.message)
  process.exit(1)
})
