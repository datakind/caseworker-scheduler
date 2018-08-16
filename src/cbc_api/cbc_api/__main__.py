import json
import os

import click
from flask_socketio import SocketIO

from cbc_api.app import app
from cbc_api.config_manager import ConfigManager
from cbc_api.dbops.dbops import DBOps

@click.group()
def main():
    """
    Welcome to the DataKind/CBC CLI! :)
    To learn more about a command, type the command and the --help flag
    """
    pass

@click.command('launch', help='Launches the API')
@click.option('--debug', is_flag=True, help='Runs in debug mode if True')
def launch(debug):
    """
    Launches the API at https://localhost:5000/
    """
    socketio = SocketIO(app)
    socketio.run(app, debug=debug)
main.add_command(launch)

@click.command('add_config', help='Adds a new configuration')
@click.option('--key', help='The key for the config')
@click.option('--value', help='The value for the config')
@click.option('--overwrite', is_flag=True, help='Overwrites existing config if true')
def add_config(key, value, overwrite):
    """
    Adds a new configuration
    """
    config_manager = ConfigManager()
    config_manager.add_config(key=key, value=value, overwrite=overwrite)
main.add_command(add_config)

@click.command('update_config', help='Updates a configuration')
@click.option('--key', help='The key for the config')
@click.option('--value', help='The value for the config')
def update_config(key, value):
    """
    Updates a new configuration
    """
    config_manager = ConfigManager()
    config_manager.update_config(key=key, value=value)
main.add_command(update_config)

@click.command('delete_config', help='Deletes a configuration')
@click.option('--key', help='The key for the config')
def delete_config(key):
    """
    Deletes a new configuration
    """
    config_manager = ConfigManager()
    config_manager.delete_config(key=key)
main.add_command(delete_config)

@click.command('list_configs', help='Lists exsiting configs')
def list_configs():
    """
    Lists existing configs
    """
    config_manager = ConfigManager()
    config_manager.list_configs()
main.add_command(list_configs)

@click.command('get_config', help='Retreives an exsiting configs')
@click.option('--key', help='The key for the config')
def get_config(key):
    """
    Lists existing configs
    """
    config_manager = ConfigManager()
    value = config_manager.get_config(key, verbose=True)
main.add_command(get_config)

@click.command('initialize_tables', help='Initializes the MySQL tables')
@click.option('--drop_existing', is_flag=True, help='Drops existing tables')
def initialize_tables(drop_existing):
    """
    Initializes the tables in mysql
    """
    # Build the tables in my sql
    dbops = DBOps()
    dbops.initialize_tables(drop_existing=drop_existing)

    # Read in the example json datafile
    path = os.path.dirname(os.path.realpath(__file__))
    filename = path + '/data/example_activities.json'
    with open(filename, 'r') as f:
        activities = json.load(f)

    # Load the demo activities into mysql
    for activity in activities:
        dbops.upsert_activity(activity)

    # Read in the default start/finish
    filename = path + '/data/example_endpoints.json'
    with open(filename, 'r') as f:
        endpoints = json.load(f)

    # Load the examples endpoints into mysql
    for endpoint in endpoints:
        dbops.upsert_endpoint(endpoint)
main.add_command(initialize_tables)

@click.command('cleanup_table', help='Deletes old records from a table')
@click.option('--table', help='The table to clean up')
@click.option('--days', help='The number of days worth of data to remove')
def cleanup_table(table, days):
    """ Cleans up old data in the specified table """
    dbops = DBOps()
    dbops.cleanup_table(table=table, days=days)
main.add_command(cleanup_table)

@click.command('insert_csv', help='Inserts a csv into a mysql table')
@click.option('--filename', help='The name of the csv to upload')
@click.option('--table', help='The table to insert into')
@click.option('--truncate', is_flag=True, help='Truncates the table')
def insert_csv(filename, table, truncate=False):
    """ Inserts values from a csv file """
    dbops = DBOps()
    dbops.insert_csv(filename=filename, table=table, truncate=truncate)
main.add_command(insert_csv)

if __name__ == '__main__':
    main()
