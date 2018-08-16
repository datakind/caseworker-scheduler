import json
import os

from cbc_api.schedule.tsp import TSP
from cbc_api.schedule.schedule import Schedule
from cbc_api.schedule.capacity_tester import CapacityTester

PATH = os.path.dirname(os.path.realpath(__file__))

def test_google_tsp():
    tsp = TSP()
    soln = tsp.solve_tsp(
        origin=[28.50,-81.25],
        destination=[28.50,-81.25],
        waypoints=[
            [28.53874, -81.37861],
            [28.54052, -81.38118],
            [28.56707, -81.38971],
            [28.4497135606058, -81.4707795871383],
            [28.5414049683169, -81.37367],
            [28.404738, -81.428915]
        ],
        method='google'
    )
    assert 'durations' in soln
    for duration in soln['durations']:
        assert type(duration) in [int,float]
    assert 'order' in soln
    for order in soln['order']:
        assert type(order) == int

def test_pyschedule_tsp():
    tsp = TSP()
    soln = tsp.solve_tsp(
        origin=[28.50,-81.25],
        destination=[28.50,-81.25],
        waypoints=[
            [28.53874, -81.37861],
            [28.54052, -81.38118],
            [28.56707, -81.38971],
            [28.4497135606058, -81.4707795871383],
            [28.5414049683169, -81.37367],
            [28.404738, -81.428915]
        ],
        method='pyschedule'
    )
    assert 'durations' in soln
    for duration in soln['durations']:
        assert type(duration) in [int,float]
    assert 'order' in soln
    for order in soln['order']:
        assert type(order) == int

def test_pyschedule_constrained_tsp():
    tsp = TSP()
    soln = tsp.solve_tsp(
        origin=[28.50,-81.25],
        destination=[28.50,-81.25],
        waypoints=[
            [28.53874, -81.37861],
            [28.54052, -81.38118],
            [28.56707, -81.38971],
            [28.4497135606058, -81.4707795871383],
            [28.5414049683169, -81.37367],
            [28.404738, -81.428915]
        ],
        constraints=[
            {
                'index1' : '4',
                'constraint_type' : 'before',
                'index2' : '2'
            },
            {
                'index1': '0',
                'constraint_type' : 'after',
                'index2' : '2'
            }
        ],
        method='pyschedule'
    )
    assert 'durations' in soln
    for duration in soln['durations']:
        assert type(duration) in [int,float]
    assert 'order' in soln
    for order in soln['order']:
        assert type(order) == int

def test_schedule():
    path = '/'.join(PATH.split('/')[:-1])
    filename = path + '/cbc_api/data/schedule_test.json'
    with open(filename, 'r') as f:
        configs = json.load(f)

    schedule = Schedule(configs)
    schedule.schedule_activities()
    assert 'activities' in schedule.configs
    assert 'distance_matrix' in schedule.configs
    for activity in schedule.configs['activities']:
        assert 'assigned_day' in activity
        assert 'cluster_coords' in activity
        assert 'coordinates' in activity
        assert 'day' in activity
        assert 'duration' in activity
        assert 'from_duration' in activity
        assert 'index' in activity
        assert 'label' in activity
        assert 'order' in activity
        assert 'to_duration' in activity

def test_capacity_tester():
    capacities = [120, 120, 240, 480, 480]
    durations = [87, 101, 132, 139, 161]
    capacity_tester = CapacityTester(capacities, durations)
    extra_days = capacity_tester.find_additional_capacity()
    assert extra_days == 3
    
    capacities = [120, 240]
    durations = [139, 161]
    capacity_tester = CapacityTester(capacities, durations)
    extra_days = capacity_tester.find_additional_capacity()
    assert extra_days == 0


