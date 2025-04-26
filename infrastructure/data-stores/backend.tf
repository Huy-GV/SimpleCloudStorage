terraform {
  backend "s3" {
    bucket = "scs-tf-states"
    key    = "scs-data-stores/terraform.tfstate"
    region = "ap-southeast-2"
  }
}
