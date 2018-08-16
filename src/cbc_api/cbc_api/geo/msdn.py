import json
import logging
import os
import requests
from urllib.parse import urlencode

import daiquiri

from cbc_api.config_manager import ConfigManager

class MSDN(object):
    def __init__(self):
        daiquiri.setup(level=logging.INFO)
        self.logger = daiquiri.getLogger(__name__)
        
        self.config_manager = ConfigManager()
        key = self.config_manager.get_config('MSDN_KEY')
        if key != None:
            self.key = key
        else:
            msg = "MSDN_KEY not found in config. "
            msg += "Run cbc_api add_config --help for more info"
            self.logger.warning(msg)

    def convert_address(self, street, city, state, zip_code, country='US'):
        """
        Calls the MSDN API to convert an address
        to lat/long coordinates
        """
        # Construct the URL for the request
        base_url = 'http://dev.virtualearth.net/REST/v1/Locations?'
        query_params = urlencode({
            'CountryRegion' : country,
            'adminDistrict' : state,
            'locality' : 'Somewhere',
            'postalCode' : zip_code,
            'addressLine' : street,
            'key' : self.key
        })
        url = base_url + query_params

        # Make the request
        response = requests.get(url)
        response_dict = json.loads(response.text)

        # Parse the output and return the coordinates
        if len(response_dict['resourceSets']) > 0:
            resource_set = response_dict['resourceSets'][0]
            if len(resource_set['resources']) > 0:
                resource = resource_set['resources'][0]
                coordinates = resource['point']['coordinates']
                return coordinates
        return None

    def compute_distance_matrix(self, coordinates):
        """
        Calls the MSDN API to compute a distance matrix
        """
        # Construct the URL for the request
        base_url = 'https://dev.virtualearth.net/REST/v1/Routes/DistanceMatrix?'
        str_coordinates = []
        for pair in coordinates:
            str_pair = [str(pair[0]), str(pair[1])]
            str_coordinates.append(str_pair)
        coord_param = ';'.join([','.join(x) for x in str_coordinates])
        query_params = urlencode({
            'origins' : coord_param,
            'destinations' : coord_param,
            'travelMode' : 'driving',
            'key' : self.key
        })
        url = base_url + query_params

        # Make the request
        response = requests.get(url)
        response_dict = json.loads(response.text)

        # Parse the output
        results = response_dict['resourceSets'][0]['resources'][0]['results']
        distances = {}
        for result in results:
            origin = result['originIndex']
            dest = result['destinationIndex']
            if 'travelDuration' in result:
                travel_duration = result['travelDuration']
            else:
                travel_duration = 1
            if travel_duration == -1:
                travel_duration = 1
            if origin not in distances:
                distances[origin] = {}
            distances[origin][dest] = travel_duration

        return distances
