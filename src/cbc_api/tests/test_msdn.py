from cbc_api.geo.msdn import MSDN

def test_convert_address():
    msdn = MSDN()
    coordinates = msdn.convert_address(
        street='1 Microsoft Way',
        city='Redmond',
        state='WA',
        zip_code='98052'
    )
    assert type(coordinates) == list
    assert len(coordinates) == 2
    assert type(coordinates[0]) == float
    assert type(coordinates[1]) == float

def test_compute_distance_matrix():
    msdn = MSDN()
    coords = [[47.60,-122.33],[-47.67,-122.19],[47.71,-122.19]]
    matrix = msdn.compute_distance_matrix(coords)
    assert len(matrix.keys()) == 3
    for key in matrix:
        for key_ in matrix[key]:
            assert type(matrix[key][key_]) in [int, float]


