#!/usr/bin/env node
import { envs, logger, test } from '@tabnews/config';
import { program } from 'commander';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const packageJson = createRequire(import.meta.url)('@tabnews/config/package.json');

const tn = program
  .name('tn')
  .version(packageJson.version, '-v, --version', 'Output the current version of tn')
  .description('TabNews command line interface')
  .allowExcessArguments()
  .configureHelp({ showGlobalOptions: true, sortSubcommands: true, sortOptions: true });

const testCommand = tn
  .command('test')
  .description('Start test environment')
  .summary('Run tests')
  .option('--coverage', 'Generate coverage report')
  .option('-t, --test-name-pattern <test>', 'Run a specific test');

testCommand.command('watch', { isDefault: true }).description('Watch mode').action(getCommand('testWatch'));

testCommand.command('run').description('Run once').action(getCommand('testRun'));

tn.parse();

function getCommand(key) {
  const commands = {
    testWatch: test.watch,
    testRun: test.run,
  };

  const environments = {
    testWatch: 'test',
    testRun: 'test',
  };

  const command = commands[key];

  if (command)
    return (_, params) => {
      const options = {
        ...params.optsWithGlobals(),
        ...params.opts(),
        args: params.args,
        spawn,
      };

      envs.load(options.envMode, environments[key] || environments.default);

      command(options);
    };

  return () => {
    logger.error('Command not found:', key);
    program.help();
  };
}
