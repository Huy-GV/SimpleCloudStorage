terraform {
  backend "s3" {
    bucket = "scs-tf-states"
    key    = "scs-image-repository/terraform.tfstate"
    region = "ap-southeast-2"
  }
}
