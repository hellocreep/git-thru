const exec = require('child_process').exec
const _ = require('lodash')

const logFormat = '{%n "commit": "%h",%n "subject": "%s",%n "author": "%an"},'

const gitCommands = {
  log: `git log -n 5 --pretty=format:'${logFormat}' --abbrev-commit`,
  checkout: `git checkout`,
  revList: 'git rev-list --all --count'
}

class Git {
  constructor() {
    this.logs = []
    this.commitCount = 0
    this.position = {
      cursor: 0,
      commidId: ''
    }
  }

  setPosition(position) {
    this.position.cursor = position.cursor
    this.position.commidId = position.commitId
  }

  setLogs(logs) {
    this.logs = logs
  }

  setCommitCount(commitCount) {
    this.commitCount = commitCount
  }

  _getCommitCount() {
    return new Promise((resolve, reject) => {
      exec(gitCommands.revList, (err, stdout, stderr) => {
        if (err) {
          console.log('err', err)
          return reject(err)
        }

        if (stderr) {
          console.log('stderr', stderr)
          return reject(err)
        }

        if (stdout) {
          const commitCount = parseInt(stdout, 10)
          resolve(commitCount)
        }
      })
    })
  }

  _getLogs() {
    return new Promise((resolve, reject) => {
      exec(gitCommands.log, (err, stdout, stderr) => {
        if (err) {
          console.log('err', err)
          return reject(err)
        }

        if (stderr) {
          console.log('stderr', stderr)
          return reject(err)
        }

        if (stdout) {
          const logList = JSON.parse(`[${stdout.slice(0, -1)}]`)

          const gotAllLogs = this.logs.length === this.commitCount
          if (gotAllLogs) {
            return resolve(this.logs)
          }

          const hasNewCommit = _.get(_.last(logList), 'commit') !== _.get(_.last(this.logs), 'commit', '')
          if (hasNewCommit) {
            return _.first(this.logs) ? resolve(_.chain(this.logs).concat(_.last(logList)).value()) : resolve(logList)
          }
        }
      })
    })
  }
}

const git = new Git()

function _nextCommit(logs, cursor) {
  const nextCommitLog = logs[cursor + 1]

  if (_.isUndefined(nextCommitLog)) {
    return Promise.resolve({done: true})
  }

  const nextCommitId = nextCommitLog.commit
  return new Promise((resolve, reject) => {
    exec(`${gitCommands.checkout} ${nextCommitId}`, (err, stdout, stderr) => {
      if (err) {
        console.log('err', err)
        return reject(err)
      }

      if (stderr) {
        return git._getLogs().then(updatedLogs => {
          return resolve({
            updatedLogs,
            position: {
              cursor: ++cursor,
              commitId: nextCommitId
            }
          })
        })
      }
    })
  })
}

function _prevCommit(logs, cursor) {
  const preveCommitLog = logs[cursor - 1]
  if (_.isUndefined(preveCommitLog)) {
    return Promise.resolve({done: true})
  }
  const preveCommitId = preveCommitLog.commit
  return new Promise((resolve, reject) => {
    exec(`${gitCommands.checkout} ${preveCommitId}`, (err, stdout, stderr) => {
      if (err) {
        console.log('err', err)
        return reject(err)
      }

      if (stderr) {
        return resolve({
          updatedLogs: logs,
          position: {
            cursor: --cursor,
            commitId: preveCommitId
          }
        })
      }
    })
  })
}

async function gitThru() {
  const commitCount = await git._getCommitCount()
  git.setCommitCount(commitCount)

  const logs = await git._getLogs()
  git.setLogs(logs)

  return {
    getLogs: () => git.logs,
    getPosition: () => git.position,
    prevCommit: () => {
      return _prevCommit(git.logs, git.position.cursor).then(({updatedLogs, position, done}) => {
        if (done) {
          return done
        }
        git.setPosition(position)
        return {
          logs: updatedLogs,
          position
        }
      })
    },
    nextCommit: () => {
      return _nextCommit(git.logs, git.position.cursor).then(({updatedLogs, position, done}) => {
        if (done) {
          return done
        }
        git.setPosition(position)
        git.setLogs(updatedLogs)
        return {
          logs: updatedLogs,
          position
        }
      })
    }
  }
}

module.exports = gitThru
