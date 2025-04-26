data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "scs-tf-states"
    key    = "scs-networking/terraform.tfstate"
    region = var.region
  }
}

data "aws_ssm_parameter" "db_password" {
  name            = "/DATABASE_PASSWORD"
  with_decryption = true
}
