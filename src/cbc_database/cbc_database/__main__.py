import logging

import click
import pandas as pd

from cbc_database.dbops import DBOps

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@click.group()
def main():
	"""
	Welcome to the CBC DBOps CLI! :)
	Use the --help flag to learn more
	"""
	pass

@click.command('load_table_from_csv', help='loads a csv file to postgres')
@click.option('--user', help='the name of the postgrs user')
@click.option('--file', help='the name of the csv file')
@click.option('--schema', help='the name of the postgres schema')
@click.option('--table', help='the name of the postgres table')
@click.option('--overwrite', is_flag=True, help='overwrites existing table if true')
def load_table_from_csv(user, file, schema, table, overwrite):
	message = "Loading %s into %s.%s"%(file, schema, table)
	logger.info(message)
	df = pd.read_csv(file)
	db = DBOps(user=user)
	db.load_df_to_postgres(
		df=df, 
		schema=schema, 
		table=table, 
		overwrite=overwrite
	)
main.add_command(load_table_from_csv)

@click.command('load_table_from_h5', help='loads a h5 file to postgres')
@click.option('--user', help='the name of the postgrs user')
@click.option('--file', help='the name of the h5 file')
@click.option('--key', help='the key from the h5 store')
@click.option('--schema', help='the name of the postgres schema')
@click.option('--table', help='the name of the postgres table')
@click.option('--overwrite', is_flag=True, help='overwrites existing table if true')
def load_table_from_h5(user, file, key, schema, table, overwrite):
	message = "Loading %s into %s.%s"%(file, schema, table)
	logger.info(message)
	store = pd.HDFStore(file)
	df = store[key]
	db = DBOps(user=user)
	db.load_df_to_postgres(
		df=df, 
		schema=schema, 
		table=table, 
		overwrite=overwrite
	)
main.add_command(load_table_from_h5)

@click.command('load_all_tables_from_h5', help='loads a h5 file to postgres')
@click.option('--user', help='the name of the postgrs user')
@click.option('--file', help='the name of the h5 file')
@click.option('--schema', help='the name of the postgres schema')
@click.option('--overwrite', is_flag=True, help='overwrites existing table if true')
def load_all_tables_from_h5(user, file, schema, overwrite):
	message = "Loading %s into %s.%s"%(file, schema, table)
	logger.info(message)
	store = pd.HDFStore(file)
	keys = store.keys()
	for key in keys:
		table = key
		df = store[key]
		db = DBOps(user=user)
		db.load_df_to_postgres(
			df=df, 
			schema=schema, 
			table=table, 
			overwrite=overwrite
		)
main.add_command(load_all_tables_from_h5)