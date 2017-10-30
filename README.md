# NodeJS cluster application (test purpose)
This is test NodeJS application for education purpose which use cluster and Redis modules.
# Cluster create workers:
* Msg generator write messages into Redis store (only one worker)
* EventHanlers (other workers) read messages from Redis store with 50% Fails/Success:
  - Failed messages objects will storing in "Hospital" (Redis invalid object store).
  - Success messages objects will be readed and removed from Redis store.
* Redis start in isolated Docker container

# Prerequisites
* NodeJS
* npm
* Docker

# Install
* git clone https://bitbucket.org/b-b-q/nc.git && cd ./nc && npm install
* to install Docker see https://docs.docker.com/engine/installation/

# Redis in Docker
* **docker run -p 6379:6379 --name redis -d redis** (download docker IMG from Docker HUB and run container [--name 'redis'] AS daemon [-d]). [-p => pass/forward ports from container to host]
* **docker stop redis** [stop container redis]
* **docker start redis** [start container redis]

# redis-cli commands
* docker exec -ti redis redis-cli --scan --pattern '*' (get all keys from redis Store)
* docker exec -ti redis redis-cli HGETALL a87ff679a2f3e71d9181a67b7542122c (get hashes object)
* docker exec -ti redis redis-cli get generator (lookup 'who is generator')
* docker exec -ti redis redis-cli flushall (drop all keys)
* docker exec -ti redis redis-cli --scan --pattern 'hospital*' (get all invalid hashes(objects) from hospital)

# Run
1. locate to project folder
2. docker start redis
3. npm start
