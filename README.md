# 2048-game-server
Simple nodeJS server for 2048 game

To start server run following commands in terminal:
  1. `npm i`
  2. `npm run run-server`

To setup mongoDB on local machine (all steps related to macOS users only):
  1. `brew tap mongodb/brew`
  2. `brew install mongodb-community@4.2`
  3. `brew services start mongodb-community@4.2`
  4. if you use Catalina OS run `mkdir -p /Users/user/data/db` and all commands from [SO post](https://stackoverflow.com/a/27267756)
  5.  `mongod --dbpath=/Users/user/data/db --replSet "rs"` - to setup replication set
  6. `mongo` -> `rs.initiate()` -> `use gamesDb` -> db.createCollection('rooms')


