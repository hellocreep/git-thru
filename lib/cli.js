#!/usr/bin/env node

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
    const currentCommit = cursor === index
    const commitMessage = `${chalk.red(log.commit)} ${chalk.green(log.subject)} <${log.author}>`
    if (currentCommit) {
      return `${logSymbols.success} ${commitMessage}`
    }

    return commitMessage
  })
}

gitThru().then(git => {
  setInterval(() => {
    logUpdate(formatLogs(git.getLogs(), git.getPosition().cursor).join('\n'))
  }, 100)

  stdin.on('data', command => {
    if (command === keyUp || command === keyJ) {
      git.prevCommit()
    }

    if (command === keyDown || command === keyK) {
      git.nextCommit()
    }

    if (command === keyCtrlC) {
      logUpdate.clear()
      process.exit()
    }
  })
})
