#!/usr/bin/env bash
service mysql start; echo "create database cbc_schedule" | mysql;

( cd cbc_api ; cbc_api add_config --overwrite  --key MYSQL_HOST --value localhost )
( cd cbc_api ; cbc_api add_config --overwrite  --key  MYSQL_USER --value root )
( cd cbc_api ; cbc_api add_config --overwrite  --key  MYSQL_PW --value password)
( cd cbc_api ; cbc_api add_config --overwrite  --key MSDN_KEY --value AgzKE3GMgjpkvOlG9_N4QhBxHeUkVsfSJqHnNfi-fBdZxatkk3WGIzuwTSXDM0B3 )
echo "ALTER USER 'root'@'localhost' IDENTIFIED BY 'password'" | mysql;
( cd cbc_api ; cbc_api initialize_tables)


