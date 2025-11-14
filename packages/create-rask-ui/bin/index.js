#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, cpSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';
import prompts from 'prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATES_DIR = join(__dirname, '..', 'templates');

function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent || '';

  if (userAgent.includes('pnpm')) {
    return 'pnpm';
  } else if (userAgent.includes('yarn')) {
    return 'yarn';
  } else if (userAgent.includes('bun')) {
    return 'bun';
  }
  return 'npm';
}

function getInstallCommand(pkgManager) {
  switch (pkgManager) {
    case 'pnpm':
      return { install: 'pnpm install', add: 'pnpm add', run: 'pnpm run' };
    case 'yarn':
      return { install: 'yarn', add: 'yarn add', run: 'yarn' };
    case 'bun':
      return { install: 'bun install', add: 'bun add', run: 'bun run' };
    default:
      return { install: 'npm install', add: 'npm install', run: 'npm run' };
  }
}

async function main() {
  console.log('\n✨ Welcome to Rask UI!\n');

  // Check for command-line argument
  const argFolderName = process.argv[2];

  // Validate folder name if provided via CLI
  if (argFolderName) {
    if (existsSync(argFolderName)) {
      console.error(`\n❌ Error: Folder "${argFolderName}" already exists`);
      process.exit(1);
    }
  }

  const questions = [
    {
      type: 'select',
      name: 'language',
      message: 'Select a language:',
      choices: [
        { title: 'TypeScript', value: 'typescript' },
        { title: 'JavaScript', value: 'javascript' }
      ],
      initial: 0
    }
  ];

  // Only ask for location if no folder name was provided via CLI
  if (!argFolderName) {
    questions.push(
      {
        type: 'select',
        name: 'location',
        message: 'Where should we create your project?',
        choices: [
          { title: 'Current folder', value: '.' },
          { title: 'New folder', value: 'new' }
        ],
        initial: 0
      },
      {
        type: prev => prev === 'new' ? 'text' : null,
        name: 'folderName',
        message: 'Project name:',
        initial: 'my-rask-app',
        validate: name => {
          if (!name) return 'Project name is required';
          if (existsSync(name)) return 'Folder already exists';
          return true;
        }
      }
    );
  }

  const response = await prompts(questions, {
    onCancel: () => {
      console.log('\n❌ Operation cancelled');
      process.exit(0);
    }
  });

  // Use CLI argument or prompt response
  const { language, location, folderName } = response;
  const finalLocation = argFolderName ? 'new' : location;
  const finalFolderName = argFolderName || folderName;
  const targetDir = finalLocation === '.' ? process.cwd() : resolve(process.cwd(), finalFolderName);
  const templateDir = join(TEMPLATES_DIR, language);
  const pkgManager = detectPackageManager();
  const commands = getInstallCommand(pkgManager);

  // Check if current directory is empty when using current folder
  if (finalLocation === '.') {
    const files = readdirSync(targetDir);
    if (files.length > 0 && !files.every(f => f.startsWith('.'))) {
      console.log('\n⚠️  Current folder is not empty!');
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'Continue anyway?',
        initial: false
      });
      if (!confirm) {
        console.log('\n❌ Operation cancelled');
        process.exit(0);
      }
    }
  }

  // Create target directory if needed
  if (finalLocation !== '.') {
    mkdirSync(targetDir, { recursive: true });
  }

  console.log(`\n📁 Creating project in ${targetDir}...\n`);

  // Copy template files
  cpSync(templateDir, targetDir, { recursive: true });

  // Update package.json with project name
  const packageJsonPath = join(targetDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  packageJson.name = finalLocation === '.' ? 'rask-app' : finalFolderName;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

  console.log('📦 Installing dependencies...\n');

  // Install dependencies
  try {
    execSync(commands.install, {
      cwd: targetDir,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });

    // Install rask-ui@latest separately
    console.log('\n📦 Installing rask-ui@latest...\n');
    execSync(`${commands.add} rask-ui@latest`, {
      cwd: targetDir,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
  } catch (error) {
    console.error('\n❌ Failed to install dependencies');
    console.error(`Please run "${commands.install}" manually`);
    process.exit(1);
  }

  // Success message
  console.log('\n✅ Project created successfully!\n');
  console.log('📝 Next steps:\n');

  if (finalLocation !== '.') {
    console.log(`   cd ${finalFolderName}`);
  }
  console.log(`   ${commands.run} dev\n`);
  console.log('🎉 Happy coding!\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
