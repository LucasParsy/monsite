#!/bin/env bash

folder="www"

d_id=$(sudo docker-compose ps -q)

sudo docker exec -it $d_id rm -rf $folder
sudo docker exec -it $d_id bundle exec jekyll build  -d $folder
sudo docker cp $d_id:/usr/src/app/$folder ./