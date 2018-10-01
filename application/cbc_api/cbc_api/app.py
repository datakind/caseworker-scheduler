#!flask/bin/python
import datetime
import json
import logging
import sys

import daiquiri
from flask import Flask, jsonify, request, abort, make_response
from flask_socketio import SocketIO

from cbc_api.dbops.dbops import DBOps
from cbc_api.geo.msdn import MSDN
from cbc_api.schedule.schedule import Schedule

if sys.version_info >= (3,6):
    from cbc_api.email.email_exporter import EmailExporter

app = Flask(__name__)

daiquiri.setup(level=logging.INFO)
LOGGER = daiquiri.getLogger(__name__)

VALID_SOLVERS = ['CBC', 'SCIP']

@app.route('/cbc_datakind/api/v1.0/test', methods=['GET'])
def test():
    """
    Used to test to make sure the API is running correctly
    """
    return jsonify({'message':'Hello, friend! :)'})

@app.route("/cbc_datakind/api/v1.0/usage", methods=["POST"])
def usage():
    """
    Posts usage data to the user metrics table
    """
    dbops = DBOps()
    user_id = request.args.get('userId')
    action = request.args.get('action')
    dbops.post_user_action(user_id, action)
    msg = '%s posted for user %s'%(action, user_id)
    LOGGER.info(msg)
    return jsonify({'message': msg})

@app.route("/cbc_datakind/api/v1.0/email", methods=["POST"])
def export_through_email():
    """
    Sends the posted schedule to the desired user.
    The JSON should have a "destination" field and a "schedule" field
    """
    if sys.version_info >= (3,6):
        content = request.get_json(silent=True)

        if not content:
            error = {"error": "JSON not found"}
            return make_response(jsonify(error),400)

        exporter = EmailExporter()

        message = exporter.prepare_email(
            content["destination"], 
            content["schedule"]
        )
        success = exporter.send_email(message)
        return jsonify({"success": success})

    else:
        LOGGER.warning('Email feature requires Python 3.6+')
        return jsonify({"success": False}) 

@app.route('/cbc_datakind/api/v1.0/saved_schedule', methods=['GET'])
def get_schedule():
    """
    Retrieves a saved schedule from the database
    """
    dbops = DBOps()
    user_id = request.args.get('userId')
    schedule = dbops.get_schedule(user_id)
    if not schedule:
        schedule = {}
    else:
        for key in schedule:
            if key not in ['userId', 'insert_timestamp']:
                schedule[key] = json.loads(schedule[key])
    return jsonify(schedule)

@app.route('/cbc_datakind/api/v1.0/saved_schedule', methods=['POST'])
def update_schedule():
    """
    Posts an updated schedule to the database
    """
    # Check to see if there is a JSON in the request
    if not request.json:
        error = {'error':'JSON not found'}
        return make_response(jsonify(error),400)
    
    schedule = request.json
    dbops = DBOps()
    dbops.upsert_schedule(schedule)
    
    msg = 'Schedule updated for user %s'%(
        schedule['userId']
    )
    return jsonify({'action': msg})

@app.route('/cbc_datakind/api/v1.0/endpoint', methods=['GET'])
def get_endpoint():
    """
    Retreives start and end locations for a user
    """
    dbops = DBOps()
    user_id = request.args.get('userId')
    endpoint = request.args.get('endpoint')
    location = dbops.get_endpoint(user_id, endpoint)

    # Use the default location if a different location
    #   hasn't been saved for the user
    if not location:
        location = dbops.get_endpoint('default', endpoint)
    
    return jsonify(location)

@app.route('/cbc_datakind/api/v1.0/endpoint', methods=['POST'])
def update_endpoint():
    """
    Updates the start or endpoint in the database
    """
    # Check to see if there is a JSON in the request
    if not request.json:
        error = {'error':'JSON not found'}
        return make_response(jsonify(error),400)
    
    location = request.json
    dbops = DBOps()
    dbops.upsert_endpoint(location)
    
    msg = '%s updated for user %s'%(
        location['endpoint'], 
        location['userId']
    )
    return jsonify({'action': msg})

@app.route('/cbc_datakind/api/v1.0/activities', methods=['GET'])
def get_activities():
    """
    Retrieves activities from the database for the specified user
    """
    user_id = request.args.get('userId')
    dbops = DBOps()
    activities = dbops.get_activities(user_id)
    for activity in activities:
        activity['completed'] = str(activity['completed'])
        activity['id'] = str(activity['id'])

    return jsonify(activities)

@app.route('/cbc_datakind/api/v1.0/activity', methods=['DELETE'])
def delete_activity():
    """
    Deletes an activity from the database
    """
    user_id = request.args.get('userId')
    id = int(request.args.get('id'))
    dbops = DBOps()
    dbops.delete_activity(user_id=user_id, id=id)

    msg = 'Activity %s deleted for user %s'%(id, user_id)
    return jsonify({'action': msg})

@app.route('/cbc_datakind/api/v1.0/activity', methods=['POST'])
def update_activity():
    """
    Upserts and activity into the database
    """
    # Check to see if there is a JSON in the request
    if not request.json:
        error = {'error':'JSON not found'}
        return make_response(jsonify(error),400)

    activity = request.json
    activity['completed'] = bool(activity['completed'])
    activity['id'] = int(activity['id'])

    dbops = DBOps()
    dbops.upsert_activity(activity)
    
    msg = 'Activity %s added for user %s'%(
        activity['id'], 
        activity['userId']
    )
    return jsonify({'action': msg})

@app.route('/cbc_datakind/api/v1.0/schedule', methods=['POST'])
def schedule_activities():
    """
    Uses the cbc_schedule package to schedule caseworker
    activities
    """
    # Check to see if there is a JSON in the request
    if not request.json:
        error = {'error':'JSON not found'}
        return make_response(jsonify(error),400)

    # Convert strings in the JSON file to integers
    configs = json_string_to_int(request.json)

    # Parse the query parameters
    method = request.args.get('method')
    if method is None:
        method = 'pyschedule'

    # Schedule the activities
    start = datetime.datetime.now()
    schedule = Schedule(configs)
    schedule.schedule_activities(method=method)

    # Try to find extra capacity
    extra_days = schedule.check_extra_capacity()
    if extra_days > 0:
        LOGGER.info('Found extra capacity, recomputing schedule')
        schedule.remove_lowest_capacity_day(n=extra_days)
        schedule.schedule_activities(method=method)
    end = datetime.datetime.now()
    run_time = str(end-start)

    return jsonify({
        'schedule' : schedule.configs,
        'run_time' : run_time
        })

@app.route('/cbc_datakind/api/v1.0/convert_address', methods=['GET'])
def convert_address():
    """
    Converts an address to lat/long coordinates
    """
    # Get the query parameters from the request
    street = request.args.get('street')
    if street is None:
        error = {'error' : 'Street not defined'}
        return make_response(jsonify(error),400)

    city = request.args.get('city')
    if city is None:
        error = {'error' : 'City not defined'}
        return make_response(jsonify(error),400)

    state = request.args.get('state')
    if state is None:
        error = {'error' : 'State not defined'}
        return make_response(jsonify(error),400)

    zip_code = request.args.get('zipCode')
    if zip_code is None:
        error = {'error' : 'Zip Code not defined'}
        return make_response(jsonify(error),400)

    # Convert the address to coordinates
    msdn = MSDN()
    coordinates = msdn.convert_address(
        street=street,
        city=city,
        state=state,
        zip_code=zip_code
    )
    
    return jsonify({
        'coordinates' : coordinates,
        'address' : {
            'street' : street,
            'city' : city,
            'state' : state,
            'zipCode' : zip_code
        }
    })

def json_string_to_int(config):
    """
    Converts strings from the json object to
    intergers so they can be used in the scheduler
    """
    config['origin']['coordinates'] = convert_coordinates(
            config['origin']['coordinates'])
    config['destination']['coordinates'] = convert_coordinates(
            config['destination']['coordinates'])

    activities = config['activities']
    for activity in activities:
        activity['coordinates'] = convert_coordinates(activity['coordinates'])

    return config

def convert_coordinates(coords):
    """
    Converts coordinates to floats
    """
    coords = [float(x) for x in coords]
    return coords

if __name__ == '__main__':
    socketio = SocketIO(app)
    socketio.run(app)
