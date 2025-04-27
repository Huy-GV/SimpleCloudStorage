data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "scs-tf-states"
    key    = "scs-networking/terraform.tfstate"
    region = var.region
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

data "aws_ssm_parameter" "jwt_secret" {
  name            = "scs/JWT_SECRET"
  with_decryption = true
}
