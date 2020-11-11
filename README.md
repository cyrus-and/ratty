# ratty

ratty makes a faithful recording of a terminal session that can then be replayed using its embedded web player. Session files are processed so that fast random access and full-text search are possible. While ratty also allows to replay the session *like a movie*, its main goal is to provide a way to go back in time and review the work done.

## [Web player](https://cardaci.xyz/ratty/)

The web player is embedded in any ratty installation, but being it a static web application it can be hosted anywhere. The version hosted at the above URL will be aligned with the release tags of this repository.

## Installation

```
npm install -g ratty
```

## Usage

Start recording a new session with:

```
ratty record
```

The above generates a session file that can be loaded by the web player, which can be started with:

```
ratty player
```
