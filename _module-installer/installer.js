const fs = require('fs-extra');
const path = require('node:path');
const chalk = require('chalk');

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
    const entriesToAdd = [
      `${boardDir}/`,
      `${worktreeDir}/`,
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
        logger.log(chalk.green(`  ✓ Added ${boardDir}/ and ${worktreeDir}/ to .gitignore`));
      } else {
        logger.log(chalk.dim(`  .gitignore already contains required entries`));
      }
    } else {
      const content = `# BMM Multi-Dev\n${entriesToAdd.join('\n')}\n`;
      await fs.writeFile(gitignorePath, content);
      logger.log(chalk.green(`  ✓ Created .gitignore with ${boardDir}/ and ${worktreeDir}/`));
    }

    // 4. IDE-specific configuration
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
