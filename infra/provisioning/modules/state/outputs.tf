output "s3_bucket" {
  value = aws_s3_bucket.terraform_state.bucket
}

output "kms_s3_key_alias_name" {
  value = aws_kms_alias.kms_s3_key_alias.name
}
