""" Checks to see if activities on different days can be consolidated """
import networkx as nx

class CapacityTester(object):
    """Uses min cut/max flow to check for extra capacity"""
    def __init__(self, capacities, durations):
        self.capacities = [x for x in capacities]
        self.capacities.sort(reverse=True)
        self.durations = durations
        self.network = nx.Graph()

    def find_additional_capacity(self):
        """
        Determines how many days can be removed while
        still meeting capacity
        """
        # See if everything will fit on one day
        if sum(self.durations) < self.capacities[0]:
            extra_days = len(self.capacities) - 1
            return extra_days

        # Otherwise calculate extra days using network flow
        total_duration = sum(self.durations)
        for i in range(len(self.capacities)):
            min_cut = self.compute_flow()
            if min_cut[0] < total_duration:
                break
            else:
                self.capacities.pop()

        if i==0:
            extra_days = 0
        else:
            extra_days = i-1

        return extra_days

    def compute_flow(self):
        """
        Computes max flow for the node set
        """
        self.build_network()
        min_cut = nx.minimum_cut(self.network, 'source', 'sink')
        return min_cut

    def build_network(self):
        """
        Builds a networkx graph for the min cut problem
        """
        self.network = nx.Graph()
        self.network.add_node('source')
        self.network.add_node('sink')

        for i, duration in enumerate(self.durations):
            name = 'activity_' + str(i)
            self.network.add_node(name)
            self.network.add_edge('source', name, capacity=duration)

        for i, capacity in enumerate(self.capacities):
            name = 'day_' + str(i)
            self.network.add_node(name)
            self.network.add_edge('sink', name, capacity=capacity)

        for i, duration in enumerate(self.durations):
            for j in range(len(self.capacities)):
                activity_name = 'activity_'+str(i)
                day_name = 'day_'+str(j)
                self.network.add_edge(activity_name, day_name, capacity=duration)
