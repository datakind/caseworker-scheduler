from cbc_api.config_manager import ConfigManager

def test_config_manger():
    config_manager = ConfigManager()
    test_value = config_manager.get_config('unittest')
    if test_value != None:
        config_manager.delete_config('unittest')

    # Test adding a config
    config_manager.add_config('unittest','test')
    test_value = config_manager.get_config('unittest')
    assert test_value == 'test'
    
    # Test updating a config
    config_manager.update_config('unittest', 'test2')
    test_value = config_manager.get_config('unittest')
    assert test_value == 'test2'

    # Test deleting a config
    config_manager.delete_config('unittest')
    test_value = config_manager.get_config('unittest')
    assert test_value == None
