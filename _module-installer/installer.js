const fs = require('fs-extra');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const chalk = require('chalk');

const execFileAsync = promisify(execFile);

/**
 * BMM Multi-Dev Module Installer
 *
 * @param {Object} options - Installation options
 * @param {string} options.projectRoot - The root directory of the target project
 * @param {Object} options.config - Module configuration from module.yaml (resolved variables)
 * @param {Array<string>} options.installedIDEs - Array of IDE codes that were installed
 * @param {Object} options.logger - Logger instance for output
 * @returns {Promise<boolean>} - Success status
 */
async function install(options) {
  const { projectRoot, config, installedIDEs, logger } = options;

  try {
    logger.log(chalk.blue('🚀 Installing BMM Multi-Dev Module...'));

    // 1. Create sprint board directory
    const boardDir = config['board_dir'] || '_bmad-board';
    const boardPath = path.join(projectRoot, boardDir);

    if (!(await fs.pathExists(boardPath))) {
      logger.log(chalk.yellow(`  Creating sprint board directory: ${boardDir}/`));
      await fs.ensureDir(boardPath);
    }

    // 2. Copy sprint board template
    const templateSource = path.join(__dirname, '..', 'templates', 'sprint-board.yaml');
    const templateDest = path.join(boardPath, 'sprint-board.yaml');

    if (await fs.pathExists(templateSource)) {
      if (!(await fs.pathExists(templateDest))) {
        await fs.copy(templateSource, templateDest);
        logger.log(chalk.green(`  ✓ Sprint board template copied to ${boardDir}/sprint-board.yaml`));
      } else {
        logger.log(chalk.dim(`  Sprint board already exists, skipping template copy`));
      }
    }

    // 3. Update .gitignore
    const gitignorePath = path.join(projectRoot, '.gitignore');
    const worktreeDir = config['worktree_dir'] || '.worktrees';
    const dockerEnvFile = config['docker_env_file'] || '.env.ports';
    const entriesToAdd = [
      `${boardDir}/`,
      `${worktreeDir}/`,
      dockerEnvFile,
    ];

    if (await fs.pathExists(gitignorePath)) {
      let gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
      let modified = false;

      for (const entry of entriesToAdd) {
        if (!gitignoreContent.includes(entry)) {
          gitignoreContent += `\n${entry}`;
          modified = true;
        }
      }

      if (modified) {
        await fs.writeFile(gitignorePath, gitignoreContent);
        logger.log(chalk.green(`  ✓ Updated .gitignore with ${entriesToAdd.join(', ')}`));
      } else {
        logger.log(chalk.dim(`  .gitignore already contains required entries`));
      }
    } else {
      const content = `# BMM Multi-Dev\n${entriesToAdd.join('\n')}\n`;
      await fs.writeFile(gitignorePath, content);
      logger.log(chalk.green(`  ✓ Created .gitignore with ${entriesToAdd.join(', ')}`));
    }

    // 4. Docker isolation setup
    const dockerIsolation = config['docker_isolation'];
    if (dockerIsolation === true || dockerIsolation === 'true') {
      await setupDockerIsolation(projectRoot, config, logger);
    } else {
      logger.log(chalk.dim('  Docker isolation disabled, skipping Docker checks'));
    }

    // 5. IDE-specific configuration
    if (installedIDEs && installedIDEs.length > 0) {
      logger.log(chalk.cyan(`  Configuring for IDEs: ${installedIDEs.join(', ')}`));

      for (const ide of installedIDEs) {
        await configureForIDE(ide, projectRoot, config, logger);
      }
    }

    logger.log(chalk.green('✓ BMM Multi-Dev Module installation complete'));
    return true;
  } catch (error) {
    logger.error(chalk.red(`Error installing BMM Multi-Dev: ${error.message}`));
    return false;
  }
}

/**
 * Validate Docker environment and port allocation for worktree isolation
 */
async function setupDockerIsolation(projectRoot, config, logger) {
  logger.log(chalk.cyan('  Configuring Docker isolation...'));

  // 4a. Verify docker compose is available
  const dockerAvailable = await checkDockerCompose(logger);
  if (!dockerAvailable) {
    logger.warn(chalk.yellow(
      '  ⚠ docker compose not found. Docker isolation is enabled but will fail at runtime.\n' +
      '    Install Docker Desktop or Docker Engine with the Compose plugin to use this feature.'
    ));
    return;
  }

  // 4b. Verify docker-compose.yml exists
  const composeFile = config['docker_compose_file'] || 'docker-compose.yml';
  const composePath = path.join(projectRoot, composeFile);

  if (await fs.pathExists(composePath)) {
    logger.log(chalk.green(`  ✓ Docker Compose file found: ${composeFile}`));
  } else {
    logger.warn(chalk.yellow(
      `  ⚠ Docker Compose file not found: ${composeFile}\n` +
      '    The workflow expects this file to exist when starting containers per worktree.'
    ));
  }

  // 4c. Validate port range
  const portBase = parseInt(config['docker_port_base'], 10) || 10200;
  const portStep = parseInt(config['docker_port_step'], 10) || 10;
  const maxWorktrees = parseInt(config['docker_max_worktrees'], 10) || 9;
  const portRangeEnd = portBase + (portStep * maxWorktrees) + (portStep - 1);

  logger.log(chalk.cyan(
    `  Port allocation: ${portBase}–${portRangeEnd} ` +
    `(${maxWorktrees} worktrees × ${portStep} ports each, slot 0 = base)`
  ));

  if (portBase < 1024) {
    logger.warn(chalk.yellow('  ⚠ Port base is below 1024 — requires elevated privileges'));
  }

  if (portRangeEnd > 65535) {
    logger.warn(chalk.yellow(
      `  ⚠ Port range exceeds 65535 (ends at ${portRangeEnd}). ` +
      'Reduce docker_max_worktrees or docker_port_step.'
    ));
  }

  // 4d. Check for port conflicts with running containers
  const conflicts = await checkPortConflicts(portBase, portRangeEnd, logger);
  if (conflicts.length > 0) {
    logger.warn(chalk.yellow(
      `  ⚠ Potential port conflicts detected:\n` +
      conflicts.map(c => `    - Port ${c.port}: ${c.process}`).join('\n')
    ));
  } else {
    logger.log(chalk.green(`  ✓ No port conflicts detected in range ${portBase}–${portRangeEnd}`));
  }

  // 4e. Log shared services configuration
  const sharedServices = config['docker_shared_services'];
  if (sharedServices && sharedServices.length > 0) {
    const serviceList = Array.isArray(sharedServices) ? sharedServices : sharedServices.split(',').map(s => s.trim()).filter(Boolean);
    if (serviceList.length > 0) {
      logger.log(chalk.cyan(`  Shared services (slot 0 ports): ${serviceList.join(', ')}`));
    }
  }

  logger.log(chalk.green('  ✓ Docker isolation configured'));
}

/**
 * Check if docker compose CLI is available
 */
async function checkDockerCompose(logger) {
  try {
    await execFileAsync('docker', ['compose', 'version'], { timeout: 5000 });
    logger.log(chalk.green('  ✓ docker compose is available'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Check for processes already listening on ports in the allocated range
 */
async function checkPortConflicts(portBase, portRangeEnd, logger) {
  const conflicts = [];

  try {
    // Use lsof to check for listeners in the port range
    const { stdout } = await execFileAsync(
      'lsof',
      ['-iTCP', `-sTCP:LISTEN`, '-nP'],
      { timeout: 5000 }
    );

    for (const line of stdout.split('\n')) {
      const match = line.match(/:(\d+)\s+\(LISTEN\)/);
      if (match) {
        const port = parseInt(match[1], 10);
        if (port >= portBase && port <= portRangeEnd) {
          const process = line.split(/\s+/)[0] || 'unknown';
          conflicts.push({ port, process });
        }
      }
    }
  } catch {
    // lsof may not be available or may fail — non-critical
    logger.log(chalk.dim('  (port conflict check skipped — lsof not available)'));
  }

  return conflicts;
}

async function configureForIDE(ide, projectRoot, config, logger) {
  const platformSpecificPath = path.join(__dirname, 'platform-specifics', `${ide}.js`);

  try {
    if (await fs.pathExists(platformSpecificPath)) {
      const platformHandler = require(platformSpecificPath);

      if (typeof platformHandler.install === 'function') {
        await platformHandler.install({ projectRoot, config, logger });
      }
    }
  } catch (error) {
    logger.warn(chalk.yellow(`  Warning: Could not configure ${ide}: ${error.message}`));
  }
}

module.exports = { install };
