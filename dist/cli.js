#!/usr/bin/env node


const exec = require('child_process').exec;
const chalk = require('chalk');
const logUpdate = require('log-update');
const cliCursor = require('cli-cursor');
const logSymbols = require('log-symbols');
const gitThru = require('./index');

cliCursor.hide();

const stdin = process.stdin;
stdin.setRawMode(true);
stdin.setEncoding('utf8');

function formatLogs(logs, cursor) {
  return logs.map((log, index) => {
    if (cursor === index) {
      return `${logSymbols.success} ${chalk.bgBlue(log.commit, log.subject, log.author)}`;
    }

    return `${chalk.red(log.commit)} ${chalk.green(log.subject)} ${log.author}`;
  });
}

gitThru().then(git => {
  setInterval(() => {
    logUpdate(formatLogs(git.getLogs(), git.getCursor()).join('\n'));
  }, 100);

  stdin.on('data', command => {
    // Up
    if (command === '\u001b[A' || command === '\u006A') {
      git.prevCommit();
    }

    // Down
    if (command === '\u001b[B' || command === '\u006B') {
      git.nextCommit();
    }

    // Quit
    if (command === '\u0003') {
      exec('git checkout master', () => {
        logUpdate.clear();
        process.exit();
      });
    }
  });
});