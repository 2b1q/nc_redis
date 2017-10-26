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
