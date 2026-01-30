const fs = require('fs-extra');
const path = require('node:path');
const chalk = require('chalk');

/**
 * Configure BMM Multi-Dev for Claude Code
 */
async function install(options) {
  const { projectRoot, config, logger } = options;

  try {
    logger.log(chalk.dim('  Configuring Claude Code integration...'));

    // Ensure slash commands reference the multi-dev workflow
    // The agents and workflows are already installed via module merge
    // This handler can add Claude Code specific configuration if needed

    logger.log(chalk.green('  ✓ Claude Code configured for multi-dev'));
    return true;
  } catch (error) {
    logger.warn(chalk.yellow(`  Warning: ${error.message}`));
    return false;
  }
}

module.exports = { install };
