#!/bin/bash

# Install magicbell-cli globally via npm if it is not already installed
if ! command -v magicbell &> /dev/null
then
    npm install -g magicbell-cli
fi

# Authenticate the CLI using the provided environment variables
magicbell login --manual

# List the runs for the specified workflow key
magicbell workflow list_runs --workflow_key "$1"
