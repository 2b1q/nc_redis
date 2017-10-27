# NodeJS cluster application (test purpose)
This is test NodeJS application for education purpose which use cluster and Redis modules.
# Cluster create workers:
* Msg generator write messages into Redis store (only one worker)
* EventHanler read messages from Redis store (other workers)
* Redis start in isolated Docker container

# Prerequisites
* NodeJS
* npm
* Docker

# Install
git clone https://bitbucket.org/b-b-q/nc.git && cd ./nc && npm install
to install Docker see https://docs.docker.com/engine/installation/

# Redis in Docker
* docker run -p 6379:6379 --name redis -d redis (download docker IMG from Docker HUB and run container [--name 'redis'] AS daemon [-d]). [-p => pass/forward ports from container to host]
* docker stop redis [stop container redis]
* docker start redis [start container redis]

# redis-cli commands
* docker exec -ti redis redis-cli --scan --pattern '*' (get all keys from redis Store)
* docker exec -ti redis redis-cli HGETALL a87ff679a2f3e71d9181a67b7542122c (get hashes object)
* docker exec -ti redis redis-cli get generator (lookup 'who is generator')
* docker exec -ti redis redis-cli flushall (drop all keys)
