#!/usr/bin/env bash
service mysql start; echo "create database cbc_schedule" | mysql;

( cd cbc_api ; cbc_api add_config --overwrite  --key MYSQL_HOST --value localhost )
( cd cbc_api ; cbc_api add_config --overwrite  --key  MYSQL_USER --value root )
( cd cbc_api ; cbc_api add_config --overwrite  --key  MYSQL_PW --value password)

####################################
#### Filled In with Your KEYS ######
####################################
( cd cbc_api ; cbc_api add_config --overwrite  --key MSDN_KEY --value $MSDN_KEY )
####################################
####################################


echo "ALTER USER 'root'@'localhost' IDENTIFIED BY 'password'" | mysql;
## Initialize the mysql tables
( cd cbc_api ; cbc_api initialize_tables)
## Run the ng server
echo "Start NG Server background"
(cd cbc-interface; ng serve 2>&1 >> /var/log/ng.log & )

echo "Start Nginx"
nginx;

echo "Launch the API"
( cd cbc_api; cbc_api launch --debug)