resource "aws_ecr_repository" "ecr_repo" {
  name                 = "scs-ecr-repo"
  force_delete         = true
  image_tag_mutability = "MUTABLE"
}
