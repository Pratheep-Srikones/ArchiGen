#!/bin/bash
# Use 'env' to set variables only for the scope of the deploy command
env $(grep -v '^#' .env | xargs) docker stack deploy --with-registry-auth -c docker-compose.prod.yml archigen_prod