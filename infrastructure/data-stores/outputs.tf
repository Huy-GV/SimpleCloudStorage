output "env_bucket" {
  value = aws_s3_bucket.env_bucket.id
}

output "data_bucket" {
  value = aws_s3_bucket.data_bucket.id
}

output "db_instance_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "db_instance_id" {
  value = aws_db_instance.postgres.id
}
