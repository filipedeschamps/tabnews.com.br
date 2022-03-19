output "db_name" {
  value = aws_db_instance.postgres.db_name
}

output "username" {
  value = aws_db_instance.postgres.username
}

output "password" {
  value     = aws_db_instance.postgres.password
  sensitive = true
}

output "port" {
  value = aws_db_instance.postgres.port
}

output "address" {
  value = aws_db_instance.postgres.address
}
