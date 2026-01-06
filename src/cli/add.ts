import { defineCommand } from 'citty'
import { join, relative } from 'pathe'
import { existsSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { consola } from 'consola'
import { loadNuxtConfig } from '@nuxt/kit'
import { generateDataTemplate } from './utils/generate-data-template'
import { generateVueTemplate } from './utils/generate-vue-template'

async function findEmailsDir(): Promise<string> {
  const cwd = process.cwd()

  try {
    const config = await loadNuxtConfig({ cwd })
    const srcDir = config.srcDir || cwd
    return join(srcDir, 'emails')
  }
  catch {
    // Fallback if nuxt config can't be loaded
    // Check for app/emails (Nuxt 4 default)
    if (existsSync(join(cwd, 'app'))) {
      return join(cwd, 'app', 'emails')
    }

    // Check for src/emails
    if (existsSync(join(cwd, 'src'))) {
      return join(cwd, 'src', 'emails')
    }

    // Fallback to emails in root
    return join(cwd, 'emails')
  }
}

function getAllDirectories(dirPath: string, basePath: string = dirPath): string[] {
  const dirs: string[] = []

  if (!existsSync(dirPath)) {
    return dirs
  }

  const entries = readdirSync(dirPath)
  for (const entry of entries) {
    const fullPath = join(dirPath, entry)
    if (statSync(fullPath).isDirectory()) {
      const relativePath = relative(basePath, fullPath)
      dirs.push(relativePath)
      // Recursively get subdirectories
      dirs.push(...getAllDirectories(fullPath, basePath))
    }
  }

  return dirs
}

export default defineCommand({
  meta: {
    name: 'add',
    description: 'Scaffold a new email template',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Name of the email template to create',
      required: true,
    },
    dir: {
      type: 'string',
      description: 'Directory to create the email in (relative to emails folder)',
      default: '',
    },
  },
  async run({ args }) {
    const emailsDir = await findEmailsDir()

    // Parse the name to extract directory path and file name
    const namePath = args.name.replace(/^\.\//, '').replace(/\.vue$/, '')
    const parts = namePath.split('/')
    const emailName = parts.pop()!
    let subDir = parts.length > 0 ? join(...parts) : ''

    // If no directory specified, check for existing directories and prompt
    if (!subDir && !args.dir) {
      const existingDirs = getAllDirectories(emailsDir)

      if (existingDirs.length > 0) {
        const useExisting = await consola.prompt('Would you like to select an existing directory?', {
          type: 'confirm',
          initial: false,
        })

        if (useExisting) {
          const selectedDir = await consola.prompt('Select a directory:', {
            type: 'select',
            options: [
              { label: 'emails/ (root)', value: '' },
              ...existingDirs.map(dir => ({ label: `emails/${dir}/`, value: dir })),
            ],
          })
          subDir = selectedDir as string
        }
      }
    }

    // Combine emailsDir with any subdirectory from args.dir and the path in name
    const targetDir = join(emailsDir, args.dir, subDir)

    // Ensure the emails directory exists
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
      consola.success(`Created emails directory: ${targetDir}`)
    }

    const fileName = `${emailName}.vue`
    const filePath = join(targetDir, fileName)
    const dataFileName = `${emailName}.data.ts`
    const dataFilePath = join(targetDir, dataFileName)

    if (existsSync(filePath)) {
      consola.error(`Email template already exists: ${filePath}`)
      process.exit(1)
    }

    // Generate templates
    const dataTemplate = generateDataTemplate(emailName)
    const vueTemplate = generateVueTemplate(emailName)

    // Write files
    writeFileSync(dataFilePath, dataTemplate, 'utf-8')
    consola.success(`Created data store: ${dataFilePath}`)

    writeFileSync(filePath, vueTemplate, 'utf-8')
    consola.success(`Created email template: ${filePath}`)
  },
})
