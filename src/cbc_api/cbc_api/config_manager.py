import json
import logging
import os

import daiquiri

class ConfigManager(object):
    def __init__(self):
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.filename = self.path + '/config.json'

        daiquiri.setup(level=logging.INFO)
        self.logger = daiquiri.getLogger(__name__)

    def load_config(self):
        """
        Loads the configuration file, or creates one if it
        doesn't already exist
        """
        # If the config file does not already exist, create it
        if 'config.json' not in os.listdir(self.path):
            config = {}
            self.save_config(config)

        # Load the json file
        with open(self.filename, 'r') as f:
            config = json.load(f)

        return config

    def save_config(self, config):
        """
        Saves the configuration file
        """
        with open(self.filename, 'w') as f:
            json.dump(config, f, indent=4)

    def add_config(self, key, value, overwrite = False):
        """
        Adds a configuration to the configuration file
        """
        config = self.load_config()

        if not overwrite and key in config:
            error = "%s is already in the config file."%(key)
            error += "use the --overwrite flag to overwrite the key"
            raise KeyError(error)

        config[key] = value
        self.logger.info("%s set to %s"%(key, value))
        self.save_config(config)

    def update_config(self, key, value):
        """
        Updates an existing config setting
        """
        config = self.load_config()

        if key not in config:
            error = "%s does not exist in the config"%(key)
            raise KeyError(error)

        self.add_config(key, value, overwrite=True)

    def delete_config(self, key):
        """
        Deletes a configuration setting
        """
        config = self.load_config()
        
        if key not in config:
            error = "%s does not exist in the config"%(key)
            raise KeyError(error)

        del config[key]
        self.logger.info("%s deleted from config"%(key))
        self.save_config(config)

    def list_configs(self):
        """
        Lists existing configurations
        """
        config = self.load_config()
        for key in config:
            msg = "Key: %s, Value: %s"%(key, config[key])
            self.logger.info(msg)

    def get_config(self, key, verbose=False):
        """
        Pulls the existing config setting for a particular key
        """
        config = self.load_config()

        if key not in config:
            if verbose:
                self.logger.info("%s not found in config"%(key))
            return None
        else:
            if verbose:
                self.logger.info("Key: %s, Value: %s"%(key, config[key]))
            return config[key]

