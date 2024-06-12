#!/bin/bash

if ! [ -x "$(command -v aws)" ]; then
  echo 'Error: AWS CLI is not installed' >&2
  exit 1
fi

if [ $# -eq 0 ]; then
  echo 'Error: env file not found' >&2
  exit 1
fi

if [ ! -f $1 ]; then
  echo 'Error: specified env file not found.' >&2
  exit 1
fi

while IFS= read -r LINE; do
  if [[ "$LINE" =~ ^\ *#.*$ ]] || [ -z "$LINE" ]; then
    continue
  fi

  # Split line into key and value
  KEY=$(echo "$LINE" | cut -d '=' -f 1)
  VALUE=$(echo "$LINE" | cut -d '=' -f 2-)

  if [[ $KEY == AWS_* ]]; then
    KEY="_$KEY"
  fi

  aws ssm put-parameter --name "$KEY" --value "$VALUE" --type "SecureString" --overwrite
  if [ $? -ne 0 ]; then
    echo "Error: Failed to set parameter '$KEY' in AWS SSM." >&2
    exit 1
  fi

  echo "Parameter '$KEY' set in AWS SSM."
done < "$1"

echo "All parameters from '$1' set successfully."
