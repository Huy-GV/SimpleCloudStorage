resource "aws_s3_bucket" "env_bucket" {
  bucket        = "scs-cdk-env"
  force_destroy = true
}

resource "aws_s3_bucket" "data_bucket" {
  bucket        = "scs-cdk-data"
  force_destroy = true
}

resource "aws_db_subnet_group" "default" {
  name       = "scs-db-subnet-group"
  subnet_ids = data.terraform_remote_state.networking.outputs.private_isolated_subnet_ids

  tags = {
    Name = "scs-db-subnet-group"
  }
}

resource "aws_db_instance" "postgres" {
  identifier              = "scs-cdk-rds"
  engine                  = "postgres"
  engine_version          = "16"
  instance_class          = "db.t3.micro"
  allocated_storage       = 20
  username                = "postgres"
  password                = data.aws_ssm_parameter.db_password.value
  db_subnet_group_name    = aws_db_subnet_group.default.name
  vpc_security_group_ids  = [data.terraform_remote_state.networking.outputs.db_sg_id]
  skip_final_snapshot     = false
  final_snapshot_identifier = "scs-cdk-rds-final"
  publicly_accessible     = false

  tags = {
    Name = "scs-cdk-postgres"
  }
}

resource "aws_ecr_repository" "ecr_repo" {
  name                 = "scs-cdk-repository"
  force_delete         = true
  image_tag_mutability = "MUTABLE"
}
