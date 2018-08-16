import logging
from operator import itemgetter

import daiquiri
from geopy.distance import vincenty
from sklearn.cluster import KMeans
import numpy as np

from cbc_api.schedule.capacity_tester import CapacityTester
from cbc_api.schedule.tsp import TSP
from cbc_api.geo.msdn import MSDN

class Schedule(object):
    def __init__(self, configs):
        daiquiri.setup(level=logging.INFO)
        self.logger = daiquiri.getLogger(__name__)

        self.configs = configs
        self.tsp = TSP()
        self.msdn = MSDN()

    def schedule_activities(self, method='pyschedule'):
        """
        Schedules the activities using an
        appropriate method given the configs
        """
        if self._valid_tsp():
            self.build_groups()
            self.build_cluster_centroids()

            # Cluster the activities
            if 'days' not in self.configs:
                days = 1 
            else:
                days_ = self.configs['days']
                days = len([x for x in days_ if days_[x] > 0])
            self.configs['activities'] = self.cluster(
                activities=self.configs['activities'],
                n_clusters=days
            )
            all_days = [x['day'] for x in self.configs['activities']]
            unique_days = list(np.unique(all_days))

            # Build the problem settings
            origin = self.configs['origin']['coordinates']
            destination = self.configs['destination']['coordinates']
            waypoints = {}
            max_idx = {}
            for i, activity in enumerate(self.configs['activities']):
                day = activity['day']
                if day not in max_idx:
                    activity['index'] = 0
                    max_idx[day] = 0
                else:
                    activity['index'] = max_idx[day] + 1
                    max_idx[day] += 1
                if day not in waypoints:
                    waypoints[day] = []
                waypoints[day].append(activity['coordinates'])

            # Add the constraints
            activities = self.configs['activities']
            if 'constraints' not in self.configs:
                constraints = []
            else:
                constraints = self.configs['constraints']
                for constraint in constraints:
                    idx1 = self.get_index(constraint['activity1'])
                    constraint['index1'] = idx1
                    idx2 = self.get_index(constraint['activity2'])
                    constraint['index2'] = idx2

            # Only use constraints for activities that occur
            # on the same day
            valid_constraints = {day:[] for day in unique_days}
            for constraint in constraints:
                day1 = self.get_day(constraint['activity1'])
                day2 = self.get_day(constraint['activity2'])
                if day1 == day2:
                    valid_constraints[day1].append(constraint)

            # Find the optimal sequence and append keys
            solns = {}
            for day in unique_days:
                soln = self.tsp.solve_tsp(
                    origin=origin, 
                    destination=destination, 
                    waypoints=waypoints[day],
                    constraints=valid_constraints[day],
                    method=method
                )
                solns[day] = soln

            for day in unique_days:
                num_activities = len(solns[day]['order'])
                for i, index in enumerate(solns[day]['order']):
                    activity = self.get_activity(day, index)
                    activity['order'] = i
                    activity['from_duration'] = solns[day]['durations'][i+1]
                    activity['to_duration'] = solns[day]['durations'][i]
            self.assign_clusters()
            activities = sorted(activities, key=itemgetter('assigned_day','order'))
            self.configs['activities'] = activities

        # Compute the distance matrix
        distance_matrix = self.distance_matrix()
        self.configs['distance_matrix'] = distance_matrix
    
    def cluster(self, activities, n_clusters=2, method='kmeans'):
        """
        Clusters the locations of activities
        """
        # Make sure the number of clusters is less
        # than the number of activities
        num_activities = len(activities)
        if num_activities <= n_clusters:
            n_clusters = num_activities

        coords = np.array([x['cluster_coords'] for x in activities])
        if method == 'kmeans':
            kmeans = KMeans(n_clusters=n_clusters, random_state=0)
            clusters = kmeans.fit_predict(coords)
            for i, cluster in enumerate(clusters):
                activities[i]['day'] = str(cluster)
        self.deconflict_days(kmeans)
        return activities

    def deconflict_days(self, kmeans):
        """
        Ensures that activities that assigned to different days
        are assigned to different clusters
        """ 
        centroids = kmeans.cluster_centers_
        for label in self.configs['day_assignments']:
            activity = self.get_activity_by_label(label)
            day = activity['day']
            allowed_days = self.find_allowed_days(label)
            coords = activity['cluster_coords']
            new_day = self.find_closest_cluster(
                activity, 
                centroids, 
                allowed_days
            )
            activity['day'] = new_day

    def find_allowed_days(self, label):
        """
        Finds which days are allowed to host an activity
        """
        activities = self.configs['activities']
        assignment = self.configs['day_assignments'][label]
        days = [x['day'] for x in activities]
        for activity in activities:
            label_ = activity['label']
            if label_ in self.configs['day_assignments']:
                assignment_ = self.configs['day_assignments'][label_]
                if assignment != assignment_:
                    day = activity['day']
                    days = [x for x in days if x != day]
        return days
                
    def find_closest_cluster(self, activity, centroids, allowed_days):
        """
        Uses vincenty distance to find the closest centroid
        """
        # Initialize variables
        coords = activity['cluster_coords']
        assignment = self.configs['day_assignments'][activity['label']]
        closest = None
        for i, centroid in enumerate(centroids):
            if str(i) in allowed_days:
                if closest is None:
                    closest = i
                else:
                    distance = vincenty(coords, centroid)
                    if distance.miles < closest:
                        closest = i
        return str(closest)

    def assign_clusters(self):
        """
        Assigns clusters to days of the week
        """
        all_days = [x['day'] for x in self.configs['activities']]
        unique_days = list(np.unique(all_days))

        # Build a list of activities and sort them
        activities = []
        for day in unique_days:
            activities.append((self.cluster_time(day), day))
        activities.sort(reverse=True)

        # Build the capacities and sort them
        capacities = []
        for day in self.configs['days']: 
            capacity = self.configs['days'][day] * 60
            capacities.append((capacity, day))
        capacities.sort(reverse=True)

        # Map clusters to assigned days
        assignments = {}
        for activity in self.configs['activities']:
            label = activity['label']
            if label in self.configs['day_assignments']:
                assigned_day = self.configs['day_assignments'][label]
                cluster = activity['day']
                assignments[cluster] = assigned_day
                capacities = [x for x in capacities if x[1] != assigned_day]
                activities = [x for x in activities if x[1] != cluster]

        # Assign the clusters to days
        for i, activity in enumerate(activities):
            cluster = str(activity[1])
            day = str(capacities[i][1])
            assignments[cluster] = day

        # Add the assigned day to the activity
        mapping = {
            "monday" : "0",
            "tuesday" : "1",
            "wednesday" : "2",
            "thursday" : "3",
            "friday" : "4",
            "saturday" : "5",
            "sunday" : "6"
        }
        activities = self.configs['activities']
        for activity in activities:
            day = activity['day']
            assigned_day = mapping[assignments[day]]
            activity['assigned_day'] = assigned_day

    def cluster_time(self, day):
        """
        Computes the total amount of time spent on activities for the day
        """
        activities = self.configs['activities']
        day_activities = [x for x in activities if x['day'] == day]
        total = 0
        for activity in day_activities:
            if activity['index'] == 0:
                total += activity['to_duration']
            total += activity['from_duration']
            total += activity['duration']
        return total

    def check_extra_capacity(self):
        """
        Checks to see if any of the days could be consolidated
        """
        durations = [self.cluster_time(str(i)) for i in range(6)]
        durations = [x for x in durations if x > 0]

        capacities = [self.configs['days'][x]*60 for x in self.configs['days']]
        capacities = [x for x in capacities if x > 0]

        capacity_tester = CapacityTester(capacities, durations)
        extra_days = capacity_tester.find_additional_capacity()

        return extra_days

    def remove_lowest_capacity_day(self, n):
        """
        Removes the lowest capacity day if there is extra capacity
        """
        if n>0:
            for i in range(n):
                lowest = 24
                lowest_day = None
                for day in self.configs['days']:
                    hours = self.configs['days'][day]
                    if hours > 0:
                        if hours < lowest:
                            lowest_day = day
                            lowest = hours
                self.logger.info('Removed %s'%(lowest_day))
                self.configs['days'][lowest_day] = 0

    def build_groups(self):
        """
        Builds sets of grouped items from list of tuples
        """
        pairs = self.configs['groups']

        # Use the group pairings to create sets
        groups = []
        if len(pairs) > 0:
            for pair in pairs:
                found = False
                for group in groups:
                    if pair[0] in group or pair[1] in group:
                        group.add(pair[0])
                        group.add(pair[1])
                        found = True
                if not found:
                    new_group = set()
                    new_group.add(pair[0])
                    new_group.add(pair[1])
                    groups.append(new_group)

            # Remove redundant sets
            group_sets = [groups[0]]
            for group in groups:
                found = False
                for group_ in group_sets:
                    intersection = group.intersection(group_)
                    if len(intersection) == 0:
                        group_sets.append(group)
                    else:
                        for item in group:
                            group_.add(item)

        self.configs['group_sets'] = [list(x) for x in groups]

    def build_cluster_centroids(self):
        """
        Builds the centroids to use during the clustering
        process by finding the mean coord for the group
        """
        groups = self.configs['group_sets']
        activities = self.configs['activities']
        for group in groups:
            # Compute the centroid of the group
            coords = []
            for item in group:
                for activity in activities:
                    if activity['label'] == item:
                        coords.append(activity['coordinates'])

            # Add the centroid for each member of the group
            centroid_x = np.mean([x[0] for x in coords])
            centroid_y = np.mean([x[1] for x in coords])
            centroid = [centroid_x, centroid_y]
            for item in group:
                for activity in activities:
                    if activity['label'] == item:
                        activity['cluster_coords'] = centroid

        # Add cluster centroid for activities that are not grouped
        for activity in activities:
            if 'cluster_coords' not in activity:
                activity['cluster_coords'] = activity['coordinates']

    def get_activity(self, day, index):
        """
        Returns the activity at the given index
        """
        activities = self.configs['activities']
        for activity in activities:
            if activity['index'] == index:
                if activity['day'] == day:
                    return activity
        return None

    def get_activity_by_label(self, label):
        """
        Returns an activity, given a label
        """
        activities = self.configs['activities']
        for activity in activities:
            if activity['label'] == label:
                return activity
        return None

    def get_index(self, label):
        """
        Returns the index of an activity given a label
        """
        label = str(label)
        activities = self.configs['activities']
        for activity in activities:
            if activity['label'] == label:
                return str(activity['index'])
        return None

    def get_day(self, label):
        """
        Returns the day for an activity
        """
        label = str(label)
        activities = self.configs['activities']
        for activity in activities:
            if activity['label'] == label:
                return str(activity['day'])
        return None

    def distance_matrix(self):
        """
        Builds a distance matrix using labels
        """
        # Create the distance matrix
        coords = [x['coordinates'] for x in self.configs['activities']]
        origin = self.configs['origin']['coordinates']
        destination = self.configs['destination']['coordinates']
        coords.append(origin)
        coords.append(destination)
        distances = self.msdn.compute_distance_matrix(coords)
        
        # Map indices to labels
        num_activities = len(self.configs['activities'])
        index_map = {
            num_activities : 'origin',
            num_activities+1 : 'destination'
        }
        for i in range(num_activities):
            label = self.configs['activities'][i]['label']
            index_map[i] = label

        # Create a distance matrix with labels
        label_distances = {}
        for key in distances.keys():
            distances_ = {}
            for key_ in distances[key].keys():
                distances_[index_map[key_]] = distances[key][key_]
            label_distances[index_map[key]] = distances_

        return label_distances


    def _valid_tsp(self):
        """
        Verifies to ensure that the configuration
        is valid
        """
        required_keys = ['activities', 'origin', 'destination']
        for key in required_keys:
            try:
                assert key in self.configs
            except:
                msg = "%s not in json keys"%(key)
                self.logger.error(msg)
                return False
        if 'constraints' in self.configs:
            try:
                assert type(self.configs['constraints']) == list
            except:
                self.logger.error('The constraints key must be a list')
                return False
            constraints = self.configs['constraints']
            for i, constraint in enumerate(constraints):
                required_keys = ['activity1', 'constraint_type', 'activity2']
                for key in required_keys:
                    try:
                        assert key in constraint
                    except:
                        msg = "%s key not in constraint %s"%(key,i)
                        self.logger.error(msg)
                        return False
        return True

