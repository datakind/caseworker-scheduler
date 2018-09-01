# Datakind/CBC API

(Hey, FactOx! Can you tell us how the API works?)>:water_buffalo: 

(I hope it 'scales' well!)>:crocodile: 

(And is e-fish-ent!)>:fish: 

(Well hey there, friends! Listen up and I'll tell you!)>:ox:

## Configurations

Configurations are managed in the `config.json` file. You do not need to manipulate this file directly. CLI commands add and delete configs. This is to enable configs to be update when the package is install to site packages. Here are a few example commands for updating configs.

Add a config
```
cbc_api add_config --key hello --value world
```

Update a config
```
cbc_api update_config --key hello --value other_world
```

Delete a config
```
cbc_api delete_config --key hello
```

List a config
```
cbc_api add_config --key hello --value world
cbc_api get_config --key hello
```

List all configs
```
cbc_api list_configs
```

The two configs you'll need to add to get up and running as the `MSDN_KEY` for Microsoft Bing Maps and `GOOGLE_KEY` for Google Maps

## Setup the MySQL Database

First install MySQL on your system. After that, connect to MySQL through the command line by running `mysql -u user -ppassowrd` (using your credentials) and then run: 

```
create database cbc_schedule
````
Onces that's done, you can initialize the MySQL tables from the `cbc_api` CLI by running. This will create the necessary tables and also load the default start/end point and demo activities into the database.

```
cbc_api initialize_tables
```


Next, you'll need to add you database configs through the config manager. Run the following commands and substitute in your information:

```
cbc_api add_config --key MYSQL_HOST --value localhost
cbc_api add_config --key MYSQL_USER --value root
cbc_api add_config --key MYSQL_PW --value mypw
```

## Run the API

First, install the `cbc_api` package by navigating to this folder in a terminal or command line and running the following command:

```
pip install -e .
```

Second, install the `cbc_schedule` package by navigating to the cbc_schedule directory in the root of this repo and following the instructions in the README.

Once you've done that, you'll be able to run the API on your local host using the following CLI command. The `--debug` flag runs the API in debug mode. If you omit that, it will still work, but you'll get less verbose terminal output

```
cbc_api launch --debug
```

To make sure everything's working, run the following command from the terminal or
paste the URL into a brower:

```
curl http://localhost:5000/cbc_datakind/api/v1.0/test
```

If everything is working properly, you'll get the following response:

```
{
  "message": "Hello, friend! :)"
}
```

## Run Test

To run the tests for this package, navigate to this folder and run the following command

```
python -m pytest
```

To run an individual test, navigate to the test folder and run

```
pytest {filename}
```

## Caseworker Activity Schedules

The caseworker activity scheduling route works by posting a configuration JSON file to the schedule end point. An example of such a JSON object appears in the `./cbc_api/api_test.json` file. You can choose a solver using the `solver` query parameter. If no solver is chosen, the CBC solver will be chosen by default. The solvers that are currently available are CBC and SCIP. Here is an example service call

```
curl -i -H "Content-Type: application/json" -X POST -d @/home/matt/schedule_api_test.json  http://localhost:5000/cbc_datakind/api/v1.0/schedule?solver='SCIP'
```

Which returns the following response

```
{
"run_time": "0:00:00.467664", 
"schedule": {
  "activities": [
  {
    "coordinates": [
      28.53874, 
      -81.37861
    ], 
    "label": "activity_1", 
    "leg": {
      "from_duration": 15, 
      "order": 5, 
      "to_duration": 19
  }
  }, 
  {
    "coordinates": [
      28.54052, 
      -81.38118
    ], 
    "label": "activity_2", 
    "leg": {
      "from_duration": 13, 
      "order": 3, 
      "to_duration": 25
    }
  }, 
  {
    "coordinates": [
      28.56707, 
      -81.38971
    ], 
    "label": "activity_3", 
    "leg": {
      "from_duration": 2, 
      "order": 1, 
      "to_duration": 15
    }
  }, 
  {
    "coordinates": [
      28.44971, 
      -81.47077
    ], 
    "label": "activity_4", 
    "leg": {
      "from_duration": 3, 
      "order": 0, 
      "to_duration": 13
    }
  }, 
  {
    "coordinates": [
      28.5414, 
      -81.37367
    ], 
    "label": "activity_5", 
    "leg": {
      "order": 4, 
      "to_duration": 2
    }
  }, 
  {
    "coordinates": [
      28.40474, 
      -81.42892
    ], 
    "label": "activity_6", 
    "leg": {
      "order": 2, 
      "to_duration": 3
    }
  }
  ], 
  "destination": {
  "coordinates": [
    28.5, 
    -81.25
  ], 
  "label": "home"
  }, 
  "origin": {
  "coordinates": [
    28.5, 
    -81.25
  ], 
  "label": "home"
  }
  }
}
```

In the configuration file, each integer increment represents a 15 minute block. So, a processing time of 1 maps to 15 minutes and a processing time of 2 maps to 30 minutes. The API is still under development, and the solution key will be replaced by a human readable schedule of activities. So don't judge me!! :)

(Woof!)>:dromedary_camel:

(You're not a dog!)>:camel:

## Emailing a schedule

To email a schedule, the application needs access to an SMTP server. You can add your credentials to the configurations using the following commands:

```
cbc_api add_config --key SMTP_SERVER --value myserver
cbc_api add_config --key SMTP_CREDENTIALS --value mycreds
```

Where SMTP_CREDENTIALS follows the following format: {"user": "myusername", "password": "mypassword"}.

## Converting an Address

The current endpoint for convert an address to coordinates proxies out to the Microsoft MSDN API. Later, we may add an option to use a different API, such as Google. The following in an example service call for this route

```
curl -i -H "Content-Type: application/json" "http://localhost:5000/cbc_datakind/api/v1.0/convert_address?street=1+Microsoft+Way&city=Redmond&state=WA&zipCode=98052" 
```

And the response is:

```
{
  "address": {
    "city": "Redmond", 
    "state": "WA", 
    "street": "1 Microsoft Way", 
    "zipCode": "98052"
  }, 
  "coordinates": [
    47.6400493433086, 
    -122.12979727784
  ]
}

```

(Found my way! Thanks, address thingy!)>:water_buffalo::department_store:

## Utility Methods

To remove items in a database table that are older than `x` days, you can use the following cli command, replace `test` and `30` with the table you want to clean up and the number of days worth of data you want to delete.

```
cbc_api cleanup_table --table test --days 30
```

To insert records from a csv file into a table, use the following command, using the filename of your csv and the target table you want to insert into. Using the truncate flag removes the records that are currently in the table.

```
cbc_api insert_csv --filename "/home/matt/my.csv" --table activities --truncate
```
