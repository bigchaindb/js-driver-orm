#!/bin/bash

set -e -x

docker-compose run --rm js-driver-orm npm run test
