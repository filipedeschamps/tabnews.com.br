output "database_db_name" {
  value = module.database.db_name
}

output "database_username" {
  value = module.database.username
}

output "database_password" {
  value     = module.database.password
  sensitive = true
}

output "database_port" {
  value = module.database.port
}

output "database_address" {
  value = module.database.address
}
