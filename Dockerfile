#Download base image ubuntu 16.04
FROM ubuntu:16.04

RUN apt-get update

# Update Ubuntu Software repository
RUN apt-get install -y software-properties-common

# Python 3.6   
RUN add-apt-repository ppa:jonathonf/python-3.6
RUN apt-get update
RUN  apt-get install -y python3.6 libpython3.6

RUN apt-get upgrade -y
RUN apt-get dist-upgrade -y

# Mysql
RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server \
 && sed -i "s/127.0.0.1/0.0.0.0/g" /etc/mysql/mysql.conf.d/mysqld.cnf \
 && mkdir /var/run/mysqld \
 && chown -R mysql:mysql /var/run/mysqld
 
VOLUME ["/var/lib/mysql"]
 
# Bunch of other stuff
RUN apt-get install -y wget nginx git curl zip nano build-essential python-pip && \
    rm -rf /var/lib/apt/lists/*

## Node and NPM
RUN echo "NODE_ENV=development" >> /etc/environment
RUN more "/etc/environment"

# Install Node.js
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash
RUN apt-get install --yes nodejs
RUN node -v
RUN npm -v
RUN npm i -g nodemon
RUN nodemon -v

# Get the Caseworker Code
RUN mkdir caseworker-scheduler
COPY cbc-interface /caseworker-scheduler/cbc-interface 
COPY cbc_api /caseworker-scheduler/cbc_api 

## Setup Python
RUN rm -f /usr/bin/python && ln -s /usr/bin/python3.6 /usr/bin/python

# Install Pip3
RUN apt-get -y install python3.6-dev python3.6-venv
RUN wget https://bootstrap.pypa.io/get-pip.py && python get-pip.py

## Setup Interface
RUN cd /caseworker-scheduler/cbc-interface && npm install && npm install -g @angular/cli 

## Fixes some error - something about ASCII came up 
ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8

## Setup the API
RUN cd /caseworker-scheduler/cbc_api && pip3 install -e . && pip3 install pandas
RUN cd /caseworker-scheduler/cbc_api && pip3 install pyschedule==0.2.16

## Copy the last files
COPY run_me_first.sh /caseworker-scheduler/run_me_first.sh
COPY nginx.conf /etc/nginx/nginx.conf


WORKDIR /caseworker-scheduler

EXPOSE 80

 