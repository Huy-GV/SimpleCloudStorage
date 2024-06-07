#!/bin/bash


cd /home/ec2-user/app
npm install --production
npm install -g dotenv-cli

ENV_VARIABLES_NAMES=("JWT_SECRET" "AWS_ACCESS_KEY" "AWS_SECRET_KEY" "AWS_BUCKET" "AWS_REGION" "CLIENT_URLS" "DATABASE_URL" "SERVER_PORT" "DOWNLOAD_DIR")

for ENV_VARIABLE in "${ENV_VARIABLES_NAMES[@]}"; do
    MODIFIED_ENV_VARIABLE="$ENV_VARIABLE"
    if [[ $ENV_VARIABLE == AWS_* ]]; then
        MODIFIED_ENV_VARIABLE="_$ENV_VARIABLE"
    fi

    echo "Reading parameter named '$MODIFIED_ENV_VARIABLE'"
    ENV_VALUE=$(aws ssm get-parameter --name "$MODIFIED_ENV_VARIABLE" --query Parameter.Value --output text)

    sudo bash -c 'echo "$1=$2" >> /home/ec2-user/app/.env.prod.aws' _ "$ENV_VARIABLE" "$ENV_VALUE"
done
