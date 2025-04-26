data "aws_availability_zones" "available" {}

resource "aws_vpc" "scs_vpc" {
  cidr_block           = "10.0.0.0/20"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "scs/scs-vpc"
  }
}

resource "aws_subnet" "public" {
  count                   = var.az_count
  vpc_id                  = aws_vpc.scs_vpc.id
  cidr_block              = cidrsubnet(aws_vpc.scs_vpc.cidr_block, 6, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = {
    Name = "scs/public-${count.index}"
  }
}

resource "aws_subnet" "private_egress" {
  count             = var.az_count
  vpc_id            = aws_vpc.scs_vpc.id
  cidr_block        = cidrsubnet(aws_vpc.scs_vpc.cidr_block, 6, count.index + 2)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = {
    Name = "scs/private-egress-${count.index}"
  }
}

resource "aws_subnet" "private_isolated" {
  count             = var.az_count
  vpc_id            = aws_vpc.scs_vpc.id
  cidr_block        = cidrsubnet(aws_vpc.scs_vpc.cidr_block, 6, count.index + 4)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = {
    Name = "scs/private-isolated-${count.index}"
  }
}

resource "aws_internet_gateway" "main_gw" {
  vpc_id = aws_vpc.scs_vpc.id
}

resource "aws_eip" "nat" {
  count = var.az_count
}

resource "aws_nat_gateway" "nat" {
  count         = var.az_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  depends_on    = [aws_internet_gateway.main_gw]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.scs_vpc.id
}

resource "aws_route_table" "private_isolated" {
  vpc_id = aws_vpc.scs_vpc.id
}

resource "aws_route_table" "private_egress" {
  vpc_id = aws_vpc.scs_vpc.id
}

resource "aws_route_table_association" "public_association" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_egress_association" {
  count          = length(aws_subnet.private_egress)
  subnet_id      = aws_subnet.private_egress[count.index].id
  route_table_id = aws_route_table.private_egress.id
}

resource "aws_route_table_association" "private_isolated_association" {
  count          = length(aws_subnet.private_isolated)
  subnet_id      = aws_subnet.private_isolated[count.index].id
  route_table_id = aws_route_table.private_isolated.id
}

resource "aws_route" "public_internet_route" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main_gw.id
}

resource "aws_route" "private_egress_internet_route" {
  route_table_id         = aws_route_table.private_egress.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main_gw.id
}

resource "aws_security_group" "alb_sg" {
  name   = "scs-cdk-alb-sg"
  vpc_id = aws_vpc.scs_vpc.id
  egress = []

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_security_group" "web_sg" {
  name   = "scs-cdk-web-sg"
  vpc_id = aws_vpc.scs_vpc.id
  egress = []

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }
}

resource "aws_security_group" "db_sg" {
  name   = "scs-cdk-db-sg"
  vpc_id = aws_vpc.scs_vpc.id
  egress = []

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web_sg.id]
  }
}

resource "aws_security_group_rule" "alb_to_web" {
  type                     = "egress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  security_group_id        = aws_security_group.alb_sg.id
  source_security_group_id = aws_security_group.web_sg.id
}

resource "aws_security_group_rule" "web_to_internet_https" {
  type              = "egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.web_sg.id
}

resource "aws_security_group_rule" "web_to_db_postgres" {
  type                     = "egress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.web_sg.id
  source_security_group_id = aws_security_group.db_sg.id
}
