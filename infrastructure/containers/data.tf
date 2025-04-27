data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "scs-tf-states"
    key    = "scs-networking/terraform.tfstate"
    region = var.region
  }
}

data "terraform_remote_state" "data_stores" {
  backend = "s3"
  config = {
    bucket = "scs-tf-states"
    key    = "scs-data-stores/terraform.tfstate"
    region = var.region
  }
}

data "terraform_remote_state" "image_repository" {
  backend = "s3"
  config = {
    bucket = "scs-tf-states"
    key    = "scs-image-repository/terraform.tfstate"
    region = var.region
  }
}

data "aws_iam_policy_document" "ecs_task_execution_role" {
  version = "2012-10-17"
  statement {
    sid     = ""
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "ecs_task_execution_role_policy" {
  statement {
    actions = [
      "ecs:StartTelemetrySession",
      "ecs:Poll"
    ]
    resources = ["*"]
  }

  statement {
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

data "aws_ssm_parameter" "db_user" {
  name            = "scs/DATABASE_USER"
  with_decryption = true
}

data "aws_ssm_parameter" "db_password" {
  name            = "scs/DATABASE_PASSWORD"
  with_decryption = true
}

data "aws_ssm_parameter" "db_name" {
  name            = "scs/DATABASE_NAME"
  with_decryption = true
}

data "aws_ssm_parameter" "server_port" {
  name            = "scs/SERVER_PORT"
  with_decryption = true
}

data "aws_ssm_parameter" "jwt_secret" {
  name            = "scs/JWT_SECRET"
  with_decryption = true
}
