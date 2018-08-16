import datetime
import logging

import pandas as pd
import psycopg2

class DBOps(object):
    def __init__(self, user, host='localhost', port='5432', 
        dbname='postgres', log_level = logging.INFO):

        logging.basicConfig(level=log_level)
        self.logger = logging.getLogger(__name__)

        self.pg_conn = psycopg2.connect(
            user=user,
            host=host,
            port=port,
            dbname=dbname
        )

    def get_table_from_postgres(self, schema, table, limit=None):
        """
        Reads in a table from postgres as a dataframe
        """
        sql = """
            SELECT *
            FROM {schema}.{table}
        """.format(schema=schema, table=table)
        if limit:
            sql += " LIMIT {limit}".format(limit=limit)
        df = pd.read_sql(sql, con=self.pg_conn)
        return df

    def load_df_to_postgres(self, df, schema, table, column_types={}, overwrite=False):
        """
        Loads a dataframe into postgres 
        Columns can be used to specify column types
        Overwrite is used to replace an existing table
        """
        start = datetime.datetime.now()
        message = "Starting database load at %s"%(start)
        self.logger.info(message)
        self._create_table(df, schema, table, column_types, overwrite)
        self._load_table_data(df, schema, table)
        finish = datetime.datetime.now()
        message = "Finished database load at %s"%(finish)
        self.logger.info(message)
        load_time = finish - start
        message = "Time to load: %s"%(load_time)
        self.logger.info(message)

    def _load_table_data(self, df, schema, table):
        """
        Loads data from a dataframe into a postgres table
        """
        df.index = range(len(df))
        df = df.where((pd.notnull(df)), None)
        # Determined which columns will be included in the insert
        columns = list(df.columns)
        num_columns = len(columns)
        insert_columns = "("
        insert_values = "("
        for i, column in enumerate(columns):
            insert_columns += column.lower()
            insert_values += "%s"
            if i < num_columns - 1:
                insert_columns += ", "
                insert_values += ", "
            else:
                insert_columns += ") "
                insert_values += ") "

        # Insert the data from the dataframe into postgres
        sql = """
            INSERT INTO {schema}.{table}
            {columns} VALUES {values}
        """.format(
            schema=schema,
            table=table,
            columns=insert_columns,
            values=insert_values
        )
        values = df.values
        num_rows = len(df)
        for i, value_list in enumerate(values):
            if i%10000 == 0:
                message = "Finished insert %s out of %s"%(i, num_rows)
                self.logger.info(message)
            value_tuple = tuple(value_list)
            with self.pg_conn.cursor() as cursor:

                cursor.execute(sql, value_tuple)
            self.pg_conn.commit()

    def _create_table(self, df, schema, table, column_types={}, overwrite=False):
        """
        Creates a new postgres table
        """
        df.index = range(len(df))        
        # Delete the old table, if necessary
        if overwrite:
            sql = """
                DROP TABLE IF EXISTS {schema}.{table}
            """.format(schema=schema, table=table)
            with self.pg_conn.cursor() as cursor:
                cursor.execute(sql)
            self.pg_conn.commit()

        # Determine column types
        columns = list(df.columns)
        num_columns = len(columns)
        column_defs = '( '
        for i, column in enumerate(columns):
            # Check to see if the column has a type definition
            if column.lower() in column_types:
                column_type = column_types[column.lower()]
            else:
                column_type = 'text'
            column_def = column + " " + column_type
            column_defs += column_def
            if i < num_columns - 1:
                column_defs += ", "
            else:
                column_defs += ");"

        # Create the table
        sql = """
            CREATE TABLE IF NOT EXISTS {schema}.{table} {columns}
        """.format(schema=schema, table=table, columns=column_defs)
        with self.pg_conn.cursor() as cursor:
            cursor.execute(sql)
        self.pg_conn.commit()