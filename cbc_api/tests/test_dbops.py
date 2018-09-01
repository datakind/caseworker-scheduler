import json
import os

import datetime
import pandas as pd

from cbc_api.dbops.dbops import DBOps

def test_activity_db():
    dbops = DBOps()
    test_activity = {
        'userId': 'testid',
        'id': 1,
        'caseName': 'testcase',
        'activityType': 'testactivity',
        'expectedDuration': 30,
        'address': 'testaddress',
        'city': 'testcity',
        'state': 'teststate',
        'zipCode': 'testzip',
        'coordinates': [1,2],
        'completed': False
    }

    dbops.upsert_activity(test_activity)
    activity = dbops.get_activity('testid', 1)
    for key in activity:
        if key != 'insert_timestamp':
            assert activity[key] == test_activity[key]

    
    test_activity2 = {
        'userId': 'testid',
        'id': 2,
        'caseName': 'testcase',
        'activityType': 'testactivity',
        'expectedDuration': 30,
        'address': 'testaddress',
        'city': 'testcity',
        'state': 'teststate',
        'zipCode': 'testzip',
        'coordinates': [1,2],
        'completed': False
    }
    dbops.upsert_activity(test_activity2)
    activity = dbops.get_activity('testid', 2)
    for key in activity:
        if key != 'insert_timestamp':
            assert activity[key] == test_activity2[key]

    activities = dbops.get_activities('testid')
    assert len(activities) == 2

    dbops.delete_activity('testid', 1)
    activity = dbops.get_activity('testid', 1)
    assert activity == None
    
    dbops.delete_activity('testid', 2)
    activity = dbops.get_activity('testid', 2)
    assert activity == None

def test_endpoint_db():
    dbops = DBOps()
    test_start = {
        'userId': 'testid',
        'endpoint': 'start',
        'address': 'testaddress',
        'city': 'testcity',
        'state': 'teststate',
        'zipCode': 'testzip',
        'coordinates': [1,2]
    }

    dbops.upsert_endpoint(test_start)
    start = dbops.get_endpoint('testid', 'start')
    for key in start:
        if key != 'insert_timestamp':
            assert start[key] == test_start[key]

    dbops.delete_endpoint('testid', 'start')
    activity = dbops.get_endpoint('testid', 'start')
    assert activity == None

def test_schedule_db():
    dbops = DBOps()
    path = os.path.dirname(os.path.realpath(__file__))
    filename = path + '/../cbc_api/data/example_schedule.json'
    with open(filename, 'r') as f:
        test_schedule = json.load(f)

    dbops.upsert_schedule(test_schedule)
    schedule = dbops.get_schedule('testid')
    for key in schedule:
        if key != 'insert_timestamp':
            if type(schedule[key]) == dict:
                for key_ in schedule[key][key_]:
                    if key_ != 'insert_timestamp':
                        assert schedule[key][key_] == test_schedule[key][key_]

    dbops.delete_schedule('testid')
    schedule = dbops.get_schedule('testid')
    assert schedule == None

def test_usage():
    dbops = DBOps()
    dbops.post_user_action('test123', 'test')

    df = dbops.get_user_action('test')
    assert len(df) > 0

    dbops.clear_user_action('test')
    df = dbops.get_user_action('test')
    assert len(df) == 0

def test_cleanup_table():
    dbops = DBOps()
    sql = "TRUNCATE cbc_schedule.test"
    with dbops.connection.cursor() as cursor:
        cursor.execute(sql)
    dbops.connection.commit()

    now = datetime.datetime.utcnow()
    past = datetime.datetime.now() - datetime.timedelta(days=31)
    sql1 = """
        INSERT INTO cbc_schedule.test
        (name, insert_timestamp)
        VALUES
        (%s, %s)
    """
    sql2 = """
        INSERT INTO cbc_schedule.test
        (name, insert_timestamp)
        VALUES
        (%s, %s)
    """
    with dbops.connection.cursor() as cursor:
        cursor.execute(sql1, ('test1', now))
        cursor.execute(sql2, ('test2', past))
    dbops.connection.commit()

    sql = "SELECT * FROM cbc_schedule.test"
    df = pd.read_sql(sql, dbops.connection)
    assert len(df) == 2

    dbops.cleanup_table('test', 30)
    sql = "SELECT * FROM cbc_schedule.test"
    df = pd.read_sql(sql, dbops.connection)
    assert len(df) == 1
    
    sql = "TRUNCATE cbc_schedule.test"
    with dbops.connection.cursor() as cursor:
        cursor.execute(sql)
    dbops.connection.commit()
    
def test_insert_csv():
    dbops = DBOps()
    sql = "TRUNCATE cbc_schedule.test"
    with dbops.connection.cursor() as cursor:
        cursor.execute(sql)
    dbops.connection.commit()

    path = os.path.dirname(os.path.realpath(__file__))
    filename = path + '/../cbc_api/data/insert_test.csv'
    dbops.insert_csv('test', filename, truncate=True)
    sql = "SELECT * FROM cbc_schedule.test"
    df = pd.read_sql(sql, dbops.connection)
    assert len(df) == 2

    sql = "TRUNCATE cbc_schedule.test"
    with dbops.connection.cursor() as cursor:
        cursor.execute(sql)
    dbops.connection.commit()
