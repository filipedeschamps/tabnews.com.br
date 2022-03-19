terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.2.0"
    }
  }

  backend "s3" {
    profile    = "tabnews"
    region     = "us-east-1"
    key        = "terraform.tfstate"
    encrypt    = true
    kms_key_id = "alias/staging-terraform-state"
  }
}

provider "aws" {
  region  = "us-east-1"
  profile = "tabnews"
}

module "state" {
  source      = "../modules/state"
  environment = var.environment
}

module "vpc" {
  source      = "../modules/vpc"
  environment = var.environment
}

module "database" {
  source         = "../modules/database"
  environment    = var.environment
  vpc_id         = module.vpc.vpc_id
  vpc_cidr_block = module.vpc.vpc_cidr_block
  route_table_id = module.vpc.route_table_id

  engine_version           = "14.1"
  instance_class           = "db.t4g.micro"
  allocated_storage        = 20
  max_allocated_storage    = 21
  backup_retention_period  = 0
  skip_final_snapshot      = true
  deletion_protection      = false
  delete_automated_backups = true
}
