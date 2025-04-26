output "vpc_id" {
  value = aws_vpc.scs_vpc.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_egress_subnet_ids" {
  value = aws_subnet.private_egress[*].id
}

output "private_isolated_subnet_ids" {
  value = aws_subnet.private_isolated[*].id
}

output "alb_sg_id" {
  value = aws_security_group.alb_sg.id
}

output "web_sg_id" {
  value = aws_security_group.web_sg.id
}

output "db_sg_id" {
  value = aws_security_group.db_sg.id
}
