resource "random_string" "s3_bucket_postfix" {
  length  = 40
  special = false
  lower   = true
  upper   = false
}

resource "aws_s3_bucket" "terraform_state" {
  bucket        = "${var.environment}-tfstate-${random_string.s3_bucket_postfix.result}"
  force_destroy = true

  tags = {
    Name        = "${var.environment}-terraform-state"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_acl" "acl" {
  bucket = aws_s3_bucket.terraform_state.id
  acl    = "private"
}

resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "public_access" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_kms_key" "s3_key" {
  description             = "${var.environment}-s3-key"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "${var.environment}-s3-key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "kms_s3_key_alias" {
  name          = "alias/${var.environment}-terraform-state"
  target_key_id = aws_kms_key.s3_key.key_id
}

resource "aws_s3_bucket_server_side_encryption_configuration" "encryption" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}
