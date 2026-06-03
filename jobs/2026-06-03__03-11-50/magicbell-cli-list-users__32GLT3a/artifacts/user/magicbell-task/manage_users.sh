#!/bin/bash

magicbell user save --data "{\"user\": {\"external_id\": \"user-${ZEALT_RUN_ID}\", \"email\": \"${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com\"}}"

magicbell user list > users.txt
