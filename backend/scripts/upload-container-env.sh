#!/bin/bash

BUCKET_NAME=$(aws ssm get-parameter --name "BUCKET_NAME" --region "$REGION" --with-decryption --query "Parameter.Value" --output text)

FILE_PATH="./aws.env"
REGION=$(aws ssm get-parameter --name "_AWS_REGION" --query Parameter.Value --with-decryption --output text)

if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "Bucket exists."
else
    echo "Bucket does not exist. Creating bucket..."
    aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" --create-bucket-configuration LocationConstraint="$REGION"
fi

PARAMETERS=("JWT_SECRET" "AWS_ACCESS_KEY" "AWS_SECRET_KEY" "AWS_BUCKET" "AWS_REGION" "CLIENT_URLS" "DATABASE_URL" "SERVER_PORT" "DOWNLOAD_DIR" "AWS_ACCOUNT_ID" "REPOSITORY_NAME")
for PARAM in "${PARAMETERS[@]}"; do
    QUERY_PARAM="$PARAM"
    if [[ "$PARAM" == AWS* ]]; then
        QUERY_PARAM="_${PARAM}"
    fi

    PARAM_VALUE=$(aws ssm get-parameter --name "$QUERY_PARAM" --region "$REGION" --with-decryption --query "Parameter.Value" --output text)

    echo "Writing parameter '$PARAM' to .env file"
    echo "$PARAM=$PARAM_VALUE" >> "$FILE_PATH"
done > "$FILE_PATH"

echo "Uploading file..."
aws s3 cp "$FILE_PATH" "s3://$BUCKET_NAME/"

echo "Upload complete."
