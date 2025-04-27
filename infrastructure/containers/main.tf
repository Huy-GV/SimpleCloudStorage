locals {
  rds_endpoint         = data.terraform_remote_state.data_stores.outputs.db_instance_endpoint
  db_instance_id       = data.terraform_remote_state.data_stores.outputs.db_instance_id
  db_name              = data.aws_ssm_parameter.db_name.value
  db_user              = data.aws_ssm_parameter.db_user.value
  db_password          = data.aws_ssm_parameter.db_password.value
  server_port          = data.aws_ssm_parameter.server_port.value
  jwt_secret           = data.aws_ssm_parameter.jwt_secret.value
  db_connection_string = "${local.db_user}:${local.db_password}@${local.rds_endpoint}:5432/${local.db_name}"
}

resource "aws_iam_role" "scs_cdk_ecs_task_execution_role" {
  name               = "ScsCdkEcsTaskExecutionRole"
  description        = "Managed IAM role for ECS Task Execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_role_policy.json
}

resource "aws_iam_policy" "scs_cdk_ecs_task_execution_role_policy" {
  name        = "AmazonECSTaskExecutionRolePolicy"
  description = "Managed policy for ECS Task Execution Role"
  policy      = data.aws_iam_policy_document.ecs_task_execution_role.json
}

resource "aws_ecs_task_definition" "scs_cdk_task_definition" {
  family                   = "scs-task-family"
  execution_role_arn       = aws_iam_role.scs_cdk_ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.scs_cdk_ecs_task_execution_role.arn
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  container_definitions = jsonencode([{
    name      = "scs-container"
    image     = data.terraform_remote_state.image_repository.outputs.ecr_image_uri
    essential = true
    memory    = "512"
    cpu       = "256"
    environment = [
      {
        name  = "DATABASE_URL"
        value = local.db_connection_string
      },
      {
        name  = "SERVER_PORT"
        value = local.server_port
      },
      {
        name  = "JWT_SECRET"
        value = local.jwt_secret
      }
    ]
  }])
}

# ALB
resource "aws_lb" "scs_alb" {
  name                       = "scs-alb"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [data.terraform_remote_state.networking.outputs.sg_id]
  subnets                    = data.terraform_remote_state.networking.outputs.subnet_ids
  enable_deletion_protection = false

  enable_cross_zone_load_balancing = true
  idle_timeout                     = 60
}

# TODO: add SSL cert and use HTTPS
resource "aws_lb_listener" "scs_alb_listener" {
  load_balancer_arn = aws_lb.scs_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"
    fixed_response {
      status_code  = 200
      content_type = "text/plain"
      message_body = "OK"
    }
  }
}

resource "aws_lb_target_group" "scs_target_group" {
  name     = "scs-cdk-target-group"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.terraform_remote_state.networking.outputs.vpc_id

  health_check {
    path                = "/"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

# ECS Service for Fargate with ALB integration
resource "aws_ecs_service" "scs_cdk_ecs_service" {
  name            = "scs-ecs-service"
  cluster         = aws_ecs_cluster.scs_cdk_ecs_cluster.id
  task_definition = aws_ecs_task_definition.scs_cdk_task_definition.arn
  desired_count   = 1

  launch_type = "FARGATE"

  network_configuration {
    subnets          = data.terraform_remote_state.networking.outputs.private_egress_subnet_ids
    security_groups  = [data.terraform_remote_state.networking.outputs.web_sg_id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.scs_target_group.arn
    container_name   = "scs-container"
    container_port   = 80
  }
}

resource "aws_ecs_cluster" "scs_cdk_ecs_cluster" {
  name = "scs-cdk-cluster"
}
