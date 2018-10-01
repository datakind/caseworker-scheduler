""" Manages connections to databases """
import datetime
import json
import logging
import os

import daiquiri
import pandas as pd
import pymysql

from cbc_api.config_manager import ConfigManager

class DBOps(object):
    """
    Manages database connections and runs
    SQL statements against the mysql database
    """
    def __init__(self):
        daiquiri.setup(level=logging.INFO)
        self.logger = daiquiri.getLogger(__name__)

        self.config_manager = ConfigManager()
        host = self.config_manager.get_config('MYSQL_HOST')
        user = self.config_manager.get_config('MYSQL_USER')
        password = self.config_manager.get_config('MYSQL_PW')

        self.path = os.path.dirname(os.path.realpath(__file__))
        self.connection = pymysql.connect(
            host=host,
            user=user,
            password=password,
            db='cbc_schedule'
        )

    def initialize_tables(self, drop_existing=False):
        """
        Builds the mysql tables if they do not exist
        """
        # Find all of the sql files
        sql_directory = self.path + '/sql/'
        files = [x for x in os.listdir(sql_directory) if x.endswith('.sql')]

        # Read an execute the sql files
        for file in files:
            if drop_existing:
                table = file.split('.')[0]
                drop = "DROP TABLE IF EXISTS cbc_schedule.%s"%(table)
                with self.connection.cursor() as cursor:
                    cursor.execute(drop)

            filename = sql_directory + file
            with open(filename, 'r') as f:
                sql = f.read()
            
            with self.connection.cursor() as cursor:
                cursor.execute(sql)
            self.connection.commit()

    def upsert_endpoint(self, location):
        """
        Updates and inserts a start or end point for a
        specified user
        """
        # Delete the existing record if it exists
        self.delete_endpoint(location['userId'], location['endpoint'])

        # Build the insert values
        values = (
            location['userId'],
            location['endpoint'],
            location['address'],
            location['city'],
            location['state'],
            location['zipCode'],
            location['coordinates'][0],
            location['coordinates'][1],
            datetime.datetime.now()
        )
        
        # Build and execute the query
        sql = """
            INSERT INTO cbc_schedule.endpoint
            (userId, endpoint, address, city, state, 
            zipCode, xCoordinate, yCoordinate, insert_timestamp)
            VALUES
            (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        with self.connection.cursor() as cursor:
            cursor.execute(sql, values)
        self.connection.commit()

    def delete_endpoint(self, user_id, endpoint):
        """
        Deletes an activity from the table
        """
        sql = """
            DELETE FROM cbc_schedule.endpoint
            WHERE userId='{user_id}' and endpoint='{endpoint}'
        """.format(user_id=user_id, endpoint=endpoint)

        with self.connection.cursor() as cursor:
            cursor.execute(sql)
        self.connection.commit()
    
    def get_endpoint(self, user_id, endpoint):
        """
        Retrieves an activity from the database
        """
        sql = """
            SELECT *
            FROM cbc_schedule.endpoint
            WHERE userId='{user_id}' and endpoint='{endpoint}'
        """.format(user_id=user_id, endpoint=endpoint)
        df = pd.read_sql(sql, self.connection)

        if len(df) > 0:
            endpoint = dict(df.loc[0])
            endpoint = self.format_activity(endpoint)
            return endpoint
        else:
            return None
        
    def upsert_activity(self, activity):
        """
        Updates and inserts an activity for the specified user
        """
        # Delete the existing record if it exists
        self.delete_activity(activity['userId'], activity['id'])

        # Build the insert values
        values = (
            activity['userId'],
            activity['id'],
            activity['caseName'],
            activity['activityType'],
            activity['expectedDuration'],
            activity['address'],
            activity['city'],
            activity['state'],
            activity['zipCode'],
            activity['coordinates'][0],
            activity['coordinates'][1],
            activity['completed'],
            datetime.datetime.now()
        )

        # Build and execute the query
        sql = """
            INSERT INTO cbc_schedule.activities
            (userId, id, caseName, activityType, expectedDuration,
            address, city, state, zipCode, xCoordinate, yCoordinate, 
            completed, insert_timestamp)
            VALUES
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        with self.connection.cursor() as cursor:
            cursor.execute(sql, values)
        self.connection.commit()

    def delete_activity(self, user_id, id):
        """
        Deletes an activity from the table
        """
        sql = """
            DELETE FROM cbc_schedule.activities
            WHERE userId='{user_id}' and id={id}
        """.format(user_id=user_id, id=id)

        with self.connection.cursor() as cursor:
            cursor.execute(sql)
        self.connection.commit()

    def get_activity(self, user_id, id):
        """
        Retrieves an activity from the database
        """
        sql = """
            SELECT *
            FROM cbc_schedule.activities
            WHERE userId='{user_id}' and id={id}
        """.format(user_id=user_id, id=id)
        df = pd.read_sql(sql, self.connection)

        if len(df) > 0:
            activity = dict(df.loc[0])
            activity = self.format_activity(activity)
            return activity
        else:
            return None

    def get_activities(self, user_id):
        """
        Retrieves all of the activities from the database
        for a given user
        """
        sql = """
            SELECT *
            FROM cbc_schedule.activities
            WHERE userId='{user_id}'
            ORDER BY id
        """.format(user_id=user_id, id=id)
        df = pd.read_sql(sql, self.connection)

        if len(df) > 0:
            activities = []
            for i in df.index:
                activity = dict(df.loc[i])
                activity = self.format_activity(activity)
                activities.append(activity)
            return activities
        else:
            return []

    def format_activity(self, activity):
        """
        Formats the activity to have the coordinate as an array
        """
        activity['coordinates'] = [
            activity['xCoordinate'],
            activity['yCoordinate']
        ]
        del activity['xCoordinate']
        del activity['yCoordinate']
        return activity

    def get_schedule(self, user_id):
        """
        Retrieves a schedule from the database
        """
        sql = """
            SELECT *
            FROM cbc_schedule.schedule
            WHERE userId='{user_id}' 
        """.format(user_id=user_id)
        df = pd.read_sql(sql, self.connection)

        if len(df) > 0:
            schedule = dict(df.loc[0])
            return schedule
        else:
            return None
    
    def delete_schedule(self, user_id):
        """
        Deletes a schedule from the table
        """
        sql = """
            DELETE FROM cbc_schedule.schedule
            WHERE userId='{user_id}'
        """.format(user_id=user_id)

        with self.connection.cursor() as cursor:
            cursor.execute(sql)
        self.connection.commit()
    
    def upsert_schedule(self, schedule):
        """
        Updates and inserts an schedule for the specified user
        """
        # Delete the existing record if it exists
        self.delete_schedule(schedule['userId'])

        # Build the insert values
        values = (
            schedule['userId'],
            json.dumps(schedule['orderedActivities']),
            json.dumps(schedule['distanceMatrix']),
            json.dumps(schedule['days']),
            json.dumps(schedule['dayMap']),
            json.dumps(schedule['scheduleStart']),
            json.dumps(schedule['scheduleEnd']),
            datetime.datetime.now()
        )

        # Build and execute the query
        sql = """
            INSERT INTO cbc_schedule.schedule
            (userId, orderedActivities, distanceMatrix, days,
            dayMap, scheduleStart, scheduleEnd, insert_timestamp)
            VALUES
            (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        with self.connection.cursor() as cursor:
            cursor.execute(sql, values)
        self.connection.commit()

    def post_user_action(self, user_id, action):
        """
        Posts an action to the usage table
        """
        sql = """
            INSERT INTO cbc_schedule.usage
            (userId, action, insert_timestamp)
            VALUES (%s, %s, %s)
        """
        values = (user_id, action, datetime.datetime.now())
        with self.connection.cursor() as cursor:
            cursor.execute(sql, values)
        self.connection.commit()

    def get_user_action(self, action=None):
        """
        Fetches user actions from the database
        """ 
        sql = """
            SELECT *
            FROM cbc_schedule.usage
        """
        if action:
            sql += " WHERE action = '%s' "%(action)
        df = pd.read_sql(sql, self.connection)
        return df

    def clear_user_action(self, action):
        """
        Clears an action type from the table
        """
        sql = """
            DELETE
            FROM cbc_schedule.usage
            WHERE action = '{action}'
        """.format(action=action)
        with self.connection.cursor() as cursor:
            cursor.execute(sql)
        self.connection.commit()

    def cleanup_table(self, table, days):
        """
        Deletes all rows in a table that are older that x days
        """
        sql = """
            DELETE FROM cbc_schedule.{table}
            WHERE insert_timestamp < 
            TIMESTAMP(DATE_SUB(NOW(), INTERVAL {days} DAY))
        """.format(table=table, days=days)
        with self.connection.cursor() as cursor:
            cursor.execute(sql)
        self.connection.commit()
        msg = 'Removed records older that %s days from %s'%(days, table)
        self.logger.info(msg)

    def insert_csv(self, table, filename, truncate=False):
        """
        Inserts the records from a csv file into a table
        """
        # Truncate the existing data, if necessary
        if truncate:
            sql = "TRUNCATE cbc_schedule.%s"%(table)
            with self.connection.cursor() as cursor:
                cursor.execute(sql)

        # Add the current timestamp as the insert date
        df = pd.read_csv(filename)
        if 'insert_timestamp' in df.columns:
            del df['insert_timestamp']
        df['insert_timestamp'] = [datetime.datetime.now() for i in df.index]

        # Insert the updated values
        cols = str(tuple(df.columns)).replace("'",'')
        vals = '(' + ', '.join(['%s' for x in df.columns]) + ')'
        for i in df.index:
            # Construct the insert values
            values = []
            for val in tuple(df.loc[i]):
                if type(val) == pd._libs.tslib.Timestamp:
                    val = val.to_pydatetime()
                values.append(val)
            values = tuple(values)

            # Load the vlaues into the table
            sql = """
                INSERT INTO cbc_schedule.{table}
                {cols} VALUES {vals}
            """.format(table=table, cols=cols, vals=vals)
            with self.connection.cursor() as cursor:
                cursor.execute(sql, values)
        self.connection.commit()

        if truncate:
            self.logger.info('Truncated %s'%(table))
        msg = 'Loaded values from %s into %s'%(filename, table)
        self.logger.info(msg)
