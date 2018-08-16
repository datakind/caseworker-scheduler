import json
import logging
import os

import daiquiri
import googlemaps

from cbc_api.config_manager import ConfigManager
from cbc_api.geo.msdn import MSDN
from pyschedule.pyschedule import Scenario
import pyschedule.solvers.mip as mip

class TSP(object):
    def __init__(self):
        daiquiri.setup(level=logging.INFO)
        self.logger = daiquiri.getLogger(__name__)
        
        self.config_manager = ConfigManager()
        key = self.config_manager.get_config('GOOGLE_KEY')
        if key != None:
            self.key = key
            self.gmaps = googlemaps.Client(key=self.key)
        else:
            msg = "GOOGLE_KEY not found in config. "
            msg += "Run cbc_api add_config --help for more info"
            self.logger.warning(msg)
            self.gmaps = None
   
        self.msdn = MSDN()

    def solve_tsp(self, origin, destination, waypoints,
            method='google', constraints=None):
        """
        Solves a TSP problem and returns the waypoints in order
        """
        if method == 'google' and constraints is not None:
            msg = 'Google TSP solver does not support constraints. '
            msg += 'Switching to pyschedule'
            self.logger.warning(msg)
            method = 'pyschedule'
        
        if method == 'google' and self.gmaps is None:
            msg = 'No Google API Key found. Solving with pyschedule. '
            self.logger.warning(msg)
            method = 'pyschedule'

        if method == 'google':
            soln = self._solve_tsp_gmaps(origin, destination, waypoints)
        elif method == 'pyschedule':
            soln = self._solve_tsp_pyschedule(
                origin=origin, 
                destination=destination, 
                waypoints=waypoints,
                constraints=constraints
            )
        else:
            self.logger.warning('%s is an invalid solver method'%(method))
            soln = None
        return soln

    def _solve_tsp_gmaps(self, origin, destination, waypoints):
        """
        Calls the google directions api to solve a tsp
        """
        # Solve the TSP
        response = self.gmaps.directions(
            origin=origin,
            destination=destination,
            waypoints=waypoints,
            optimize_waypoints=True
        )

        # Parse the results
        soln = dict()
        order = response[0]['waypoint_order'] 
        soln['order'] = order

        durations = []
        for leg in response[0]['legs']:
            duration = int(leg['duration']['text'].split(' ')[0])
            durations.append(duration)
        soln['durations'] = durations

        return soln

    def _solve_tsp_pyschedule(self, origin, destination, waypoints, constraints = None, solver='CBC'):
        """
        Solves the TSP using pyschedule
        """
        # Compute the distance matrix
        coords = [x for x in waypoints]
        coords.append(origin)
        origin_idx = len(coords) - 1
        if destination != origin:
            coords.append(destination)
            dest_idx = len(coords) - 1
        else:
            dest_idx = origin_idx
        distances = self.msdn.compute_distance_matrix(coords)

        # Build the scenario, tasks and resources
        scenario = Scenario('TSP')
        keys = [str(i) for i in range(len(waypoints))]
        keys.append('START')
        keys.append('END')
        tasks = { i : scenario.Task(i) for i in keys }
        worker = scenario.Resource('Worker')

        # Worker needs to pass through every city
        for task in keys:
            tasks[task] += worker

        # Make sure the scenario STARTs and ends at the right place
        scenario += tasks['START'] < { tasks[x] for x in keys if x != 'START' }
        scenario += tasks['END'] > { tasks[x] for x in keys if x != 'END' }

        # Add constraints to the problem
        if constraints:
            for constraint in constraints:
                activity1 = constraint['index1']
                activity2 = constraint['index2']
                constraint_type = constraint['constraint_type']
                if constraint_type == 'Before':
                    scenario += tasks[activity1] < tasks[activity2]
                elif constraint_type == 'After':
                    scenario += tasks[activity1] > tasks[activity2]

        # Add distances as conditional precedences
        driving_distances = []
        for task in keys:
            for task_ in keys:
                if task != task_ and task != 'END' and task_ != 'START':
                    if task == 'START':
                        start_idx = origin_idx
                    else:
                        start_idx = int(task)

                    if task_ == 'END':
                        end_idx = dest_idx
                    else:
                        end_idx = int(task_)

                    distance = distances[start_idx][end_idx]
                    driving_distances.append(
                        tasks[task] + int(distance) << tasks[task_]
                    )
        scenario += driving_distances
        
        # Add the objective and solve
        scenario += tasks['END']*1
        mip.solve_bigm(scenario,kind=solver)
        results = scenario.solution()[1:-1]

        # Parse the results
        soln = {'order':[], 'durations':[]}
        for i, result in enumerate(results):
            if i == 0:
                last_activity = origin_idx
            else:
                last_activity = int(results[i-1][0].name)
            activity = int(result[0].name)
            soln['order'].append(activity)
            duration = int(distances[last_activity][activity])
            soln['durations'].append(duration)
        final_activity = int(results[-1][0].name)
        last_leg = int(distances[final_activity][dest_idx])
        soln['durations'].append(last_leg)

        return soln





