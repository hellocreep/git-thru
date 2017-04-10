#!/usr/bin/env node

const exec = require('child_process').exec
const chalk = require('chalk')
const logUpdate = require('log-update')
const cliCursor = require('cli-cursor')
const logSymbols = require('log-symbols')
const gitThru = require('./index')

cliCursor.hide()

const stdin = process.stdin
stdin.setRawMode(true)
stdin.setEncoding('utf8')

const keyUp = '\u001b[A'
const keyDown = '\u001b[B'
const keyJ = '\u006A'
const keyK = '\u006B'
const keyCtrlC = '\u0003'

function formatLogs(logs, cursor) {
  return logs.map((log, index) => {
    if (cursor === index) {
      return `${logSymbols.success} ${chalk.bgBlue(log.commit, log.subject, log.author)}`
    }

    return `${chalk.red(log.commit)} ${chalk.green(log.subject)} ${log.author}`
  })
}

gitThru().then(git => {
  setInterval(() => {
    logUpdate(formatLogs(git.getLogs(), git.getCursor()).join('\n'))
  }, 100)

  stdin.on('data', command => {
    // Up
    if (command === keyUp || command === keyJ) {
      git.prevCommit()
    }

    // Down
    if (command === keyDown || command === keyK) {
      git.nextCommit()
    }

    // Quit
    if (command === keyCtrlC) {
      exec('git checkout master', () => {
        logUpdate.clear()
        process.exit()
      })
    }
  })
})
