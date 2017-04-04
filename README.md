# git-thru

Thru git commits

Use key `up` and `down` to quick thru git commits easily.

![](https://raw.githubusercontent.com/hellocreep/git-thru/master/git-thru-screenshot.jpeg)

## Install

```console
$ npm install --global git-thru
```

## Cli Usage

```console
$ git-thru
```

## API Usage

```js
const gitThru = require('git-thru')

gitThru().then(git => {
  // get current git logs
  git.getLogs()

  // get current commit cursor
  git.getCursor()

  // checkout to next commit
  git.nextCommit()

  // checkout back to prev commit
  git.prevCommit()  
})
```
