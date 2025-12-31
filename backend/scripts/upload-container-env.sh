#!/bin/bash
FILE_PATH="./aws.env"
REGION_AWS=$(aws ssm get-parameter --name "REGION_AWS" --query Parameter.Value --with-decryption --output text)
DATA_BUCKET_AWS=$(aws ssm get-parameter --name "DATA_BUCKET_AWS" --region "$REGION_AWS" --with-decryption --query "Parameter.Value" --output text)
ENV_BUCKET_AWS=$(aws ssm get-parameter --name "ENV_BUCKET_AWS" --region "$REGION_AWS" --with-decryption --query "Parameter.Value" --output text)


PARAMETERS=("JWT_SECRET" "SERVER_URL" "SERVER_PORT" "REPOSITORY_NAME")
for PARAM in "${PARAMETERS[@]}"; do
    PARAM_VALUE=$(aws ssm get-parameter --name "$PARAM" --region "$REGION_AWS" --with-decryption --query "Parameter.Value" --output text)

    echo "$PARAM=$PARAM_VALUE" >> "$FILE_PATH"
done > "$FILE_PATH"

DATABASE_ENDPOINT=$(aws ssm get-parameter --name "DATABASE_ENDPOINT" --region "$REGION_AWS" --with-decryption --query "Parameter.Value" --output text)
DATABASE_NAME=$(aws ssm get-parameter --name "DATABASE_NAME" --region "$REGION_AWS" --with-decryption --query "Parameter.Value" --output text)
DATABASE_PASSWORD=$(aws ssm get-parameter --name "DATABASE_PASSWORD" --region "$REGION_AWS" --with-decryption --query "Parameter.Value" --output text)
DATABASE_USER=$(aws ssm get-parameter --name "DATABASE_USER" --region "$REGION_AWS" --with-decryption --query "Parameter.Value" --output text)

echo "REGION_AWS=$REGION_AWS" >> "$FILE_PATH"
echo "DATA_BUCKET_AWS=$DATA_BUCKET_AWS" >> "$FILE_PATH"
echo "DATABASE_ENDPOINT=$DATABASE_ENDPOINT" >> "$FILE_PATH"
echo "DATABASE_NAME=$DATABASE_NAME" >> "$FILE_PATH"
echo "DATABASE_PASSWORD=$DATABASE_PASSWORD" >> "$FILE_PATH"
echo "DATABASE_USER=$DATABASE_USER" >> "$FILE_PATH"
echo "DATABASE_URL=postgresql://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_ENDPOINT/$DATABASE_NAME" >> "$FILE_PATH"

echo "Uploading file..."
aws s3 cp "$FILE_PATH" "s3://$ENV_BUCKET_AWS/" || exit -1

echo "Upload successful"
