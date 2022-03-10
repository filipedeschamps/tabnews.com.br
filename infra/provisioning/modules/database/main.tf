resource "random_password" "postgres_password" {
  length           = 99
  special          = true
  override_special = "-+=_^~,."
}

resource "random_string" "postgres_username" {
  length  = 62
  special = false
}

resource "random_integer" "postgres_port" {
  min = 1024
  max = 49151
}

resource "random_integer" "postgres_random_identifier_suffix" {
  min = 0
  max = 999999999999
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_subnet" "postgres_subnet" {
  count                   = 2
  vpc_id                  = var.vpc_id
  cidr_block              = cidrsubnet(var.vpc_cidr_block, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.environment}-postgres-subnet-${count.index}"
    Environment = var.environment
  }
}

resource "aws_db_subnet_group" "postgres_subnet_group" {
  name       = "${var.environment}-postgres-subnet-group"
  subnet_ids = aws_subnet.postgres_subnet.*.id

  tags = {
    Name        = "${var.environment}-postgres-subnet-group"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "postgres_route_table_association" {
  count          = length(aws_subnet.postgres_subnet)
  subnet_id      = aws_subnet.postgres_subnet[count.index].id
  route_table_id = var.route_table_id
}

resource "aws_security_group" "postgres_security_group" {
  name                   = "${var.environment}-postgres-security-group"
  vpc_id                 = var.vpc_id
  revoke_rules_on_delete = true

  ingress {
    from_port        = random_integer.postgres_port.result
    to_port          = random_integer.postgres_port.result
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.environment}-postgres-security-group"
    Environment = var.environment
  }
}

resource "aws_db_parameter_group" "parameter_group" {
  name   = "${var.environment}-parameter-group"
  family = "postgres14"

  parameter {
    name  = "idle_session_timeout"
    value = "0"
  }

  tags = {
    Name        = "${var.environment}-parameter-group"
    Environment = var.environment
  }
}

resource "aws_db_instance" "postgres" {
  identifier        = "${var.environment}-postgres-${random_integer.postgres_random_identifier_suffix.result}"
  storage_type      = "gp2"
  allocated_storage = var.allocated_storage
  engine            = "postgres"
  engine_version    = var.engine_version
  instance_class    = var.instance_class

  username                    = "u${random_string.postgres_username.result}" # has to start with a letter
  password                    = random_password.postgres_password.result
  db_name                     = "tabnews"
  port                        = random_integer.postgres_port.result
  publicly_accessible         = true
  multi_az                    = false
  max_allocated_storage       = var.max_allocated_storage
  allow_major_version_upgrade = true
  auto_minor_version_upgrade  = true

  db_subnet_group_name   = aws_db_subnet_group.postgres_subnet_group.name
  vpc_security_group_ids = [aws_security_group.postgres_security_group.id]

  apply_immediately         = true
  backup_retention_period   = var.backup_retention_period
  backup_window             = "04:00-05:00"
  maintenance_window        = "wed:06:00-wed:07:00"
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = "${var.environment}-postgres-final-snapshot-${random_integer.postgres_random_identifier_suffix.result}"
  copy_tags_to_snapshot     = true
  deletion_protection       = var.deletion_protection
  delete_automated_backups  = var.delete_automated_backups

  parameter_group_name = aws_db_parameter_group.parameter_group.name

  tags = {
    Name        = "${var.environment}-postgres"
    Environment = var.environment
  }

}
