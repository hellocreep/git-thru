let gitThru = (() => {
  var _ref = _asyncToGenerator(function* () {
    commitCount = yield getCommitCount();
    gitLogs = yield getLogs();

    return {
      getLogs: function () {
        return gitLogs;
      },
      getCursor: function () {
        return gitCursor;
      },
      prevCommit: function () {
        return prevCommit(gitLogs, gitCursor).then(function ({ updatedLogs, position, done }) {
          if (done) {
            return done;
          }
          updateGitCursor(position.cursor);
          return {
            logs: updatedLogs,
            position
          };
        });
      },
      nextCommit: function () {
        return nextCommit(gitLogs, gitCursor).then(function ({ updatedLogs, position, done }) {
          if (done) {
            return done;
          }
          updateGitCursor(position.cursor);
          updateGitLogs(updatedLogs);
          return {
            logs: updatedLogs,
            position
          };
        });
      }
    };
  });

  return function gitThru() {
    return _ref.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const exec = require('child_process').exec;
const _ = require('lodash');

const logFormat = '{%n "commit": "%h",%n "subject": "%s",%n "author": "%an"},';

const gitCommands = {
  log: `git log -n 5 --pretty=format:'${logFormat}' --abbrev-commit`,
  checkout: `git checkout`,
  revList: 'git rev-list --all --count'
};

let gitLogs = [];
let gitCursor = 0;
let commitCount = 0;

function updateGitCursor(cursor) {
  gitCursor = cursor;
}

function updateGitLogs(logs) {
  gitLogs = logs;
}

function updateCommitCount(count) {
  commitCount = count;
}

function getCommitCount() {
  return new Promise((resolve, reject) => {
    exec(gitCommands.revList, (err, stdout, stderr) => {
      if (err) {
        console.log('err', err);
        return reject(err);
      }

      if (stderr) {
        console.log('stderr', stderr);
        return reject(err);
      }

      if (stdout) {
        commitCount = parseInt(stdout, 10);
        updateCommitCount(commitCount);
        resolve(commitCount);
      }
    });
  });
}

function getLogs() {
  return new Promise((resolve, reject) => {
    exec(gitCommands.log, (err, stdout, stderr) => {
      if (err) {
        console.log('err', err);
        return reject(err);
      }

      if (stderr) {
        console.log('stderr', stderr);
        return reject(err);
      }

      if (stdout) {
        const logList = JSON.parse(`[${stdout.slice(0, -1)}]`);
        if (gitLogs.length === commitCount) {
          return resolve(gitLogs);
        }
        if (gitLogs.length === 0) {
          gitLogs = logList;
        } else {
          const lastVisibleCommit = _.last(logList);
          if (lastVisibleCommit.commit !== _.last(gitLogs).commit) {
            gitLogs = gitLogs.concat(lastVisibleCommit);
          }
        }
        return resolve(gitLogs);
      }
    });
  });
}

function nextCommit(logs, cursor) {
  const nextCommitLog = logs[cursor + 1];

  if (_.isUndefined(nextCommitLog)) {
    return Promise.resolve({ done: true });
  }

  const nextCommitId = nextCommitLog.commit;
  return new Promise((resolve, reject) => {
    exec(`${gitCommands.checkout} ${nextCommitId}`, (err, stdout, stderr) => {
      if (err) {
        console.log('err', err);
        return reject(err);
      }

      if (stderr) {
        return getLogs().then(updatedLogs => {
          return resolve({
            updatedLogs,
            position: {
              cursor: ++cursor,
              commidId: nextCommitId
            }
          });
        });
      }
    });
  });
}

function prevCommit(logs, cursor) {
  const preveCommitLog = logs[cursor - 1];
  if (_.isUndefined(preveCommitLog)) {
    return Promise.resolve({ done: true });
  }
  const preveCommitId = preveCommitLog.commit;
  return new Promise((resolve, reject) => {
    exec(`${gitCommands.checkout} ${preveCommitId}`, (err, stdout, stderr) => {
      if (err) {
        console.log('err', err);
        return reject(err);
      }

      if (stderr) {
        return resolve({
          updatedLogs: logs,
          position: {
            cursor: --cursor,
            commidId: preveCommitId
          }
        });
      }
    });
  });
}

exports.getLogs = getLogs;
exports.nextCommit = nextCommit;
exports.prevCommit = prevCommit;

module.exports = gitThru;