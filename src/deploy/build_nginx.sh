# Install nginx
sudo apt-get install nginx

# Move the configs to the expected locations
sudo cp default /etc/nginx/sites-available/.
sudo cp default /etc/nginx/sites-enabled/.

# Do a production build of the app
cd ../cbc-interface
ng build --prod
cp -r dist /var/www/.
sudo mv /var/www/dist /var/www/cbc_datakind

# Start nginx
sudo systemctl restart nginx
