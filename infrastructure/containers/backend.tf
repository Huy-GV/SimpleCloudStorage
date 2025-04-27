terraform {
  backend "s3" {
    bucket = "scs-tf-states"
    key    = "scs-containers/terraform.tfstate"
    region = "ap-southeast-2"
  }
}
