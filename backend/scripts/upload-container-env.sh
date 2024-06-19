#!/bin/bash
FILE_PATH="./aws.env"
REGION=$(aws ssm get-parameter --name "REGION_AWS" --query Parameter.Value --with-decryption --output text)
BUCKET_NAME=$(aws ssm get-parameter --name "BUCKET_AWS" --region "$REGION" --with-decryption --query "Parameter.Value" --output text)

PARAMETERS=("JWT_SECRET" "REGION_AWS" "CLIENT_URLS" "SERVER_PORT" "DOWNLOAD_DIR" "REPOSITORY_NAME")
for PARAM in "${PARAMETERS[@]}"; do
    PARAM_VALUE=$(aws ssm get-parameter --name "$QUERY_PARAM" --region "$REGION" --with-decryption --query "Parameter.Value" --output text)

    echo "$PARAM=$PARAM_VALUE" >> "$FILE_PATH"
done > "$FILE_PATH"

DATABASE_ENDPOINT=$(aws ssm get-parameter --name "DATABASE_ENDPOINT" --region "$REGION" --with-decryption --query "Parameter.Value" --output text)
DATABASE_NAME=$(aws ssm get-parameter --name "DATABASE_NAME" --region "$REGION" --with-decryption --query "Parameter.Value" --output text)
DATABASE_PASSWORD=$(aws ssm get-parameter --name "DATABASE_PASSWORD" --region "$REGION" --with-decryption --query "Parameter.Value" --output text)
DATABASE_USER=$(aws ssm get-parameter --name "DATABASE_USER" --region "$REGION" --with-decryption --query "Parameter.Value" --output text)

echo "DATABASE_ENDPOINT=$DATABASE_ENDPOINT" >> "$FILE_PATH"
echo "DATABASE_NAME=$DATABASE_NAME" >> "$FILE_PATH"
echo "DATABASE_PASSWORD=$DATABASE_PASSWORD" >> "$FILE_PATH"
echo "DATABASE_USER=$DATABASE_USER" >> "$FILE_PATH"
echo "DATABASE_URL=postgresql://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_ENDPOINT/$DATABASE_NAME" >> "$FILE_PATH"

echo "Uploading file..."
aws s3 cp "$FILE_PATH" "s3://$BUCKET_NAME/" || exit -1

echo "Upload successful"
