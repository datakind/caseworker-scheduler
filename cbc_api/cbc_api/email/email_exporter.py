import arrow
import logging
import smtplib

from email.message import EmailMessage
import daiquiri

from cbc_api.config_manager import ConfigManager

rn = "\r\n" # Line break in plain text emails

class EmailExporter:
    def __init__(self):
        """
        Constructor for an Email Exporter object. The class is tasked with 
        composing emails for case workers given their schedules and sending
        the emails through SMTP

        Args:
            server_location (str): The URI of host
            credentials (dict): If authentication is required, dictionary with two fields: "user" and "password"

        """
        daiquiri.setup(level=logging.INFO)
        self.logger = daiquiri.getLogger(__name__)

        config_manager = ConfigManager()

        server_location = config_manager.get_config('SMTP_SERVER')
        if server_location:
            self.server_location = server_location
        else:
            self.server_location = None
            msg = 'SMTP_SERVER not found in config. '
            msg += 'Run cbc_api add_config --help for more info'
            self.logger.warning(msg)

        credentials = config_manager.get_config('SMTP_CREDENTIALS')
        if credentials != None:
            self.credentials = credentials
        else:
            msg = 'SMTP_CREDENTIALS not found in config. '
            msg += 'Run cbc_api add_config --help for more info'
            self.logger.warning(msg)

    def parse_schedule(self, schedule):
        """
        Reads a schedule and converts it to a plain text email body.

        Args:
            schedule (dict): Has a dictionary of days, including activities and their corresponding information.

        Returns:
            str: String representation of the schedule.
        """
        default_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        body = ""

        for day in default_days:
            if day in schedule:
                total_time = float(schedule[day]["totalTime"])/60 # Number of hours
                body += f"{day} - {total_time:.1f} hours{rn}"
                activities = schedule[day]["activities"]
                for activity in activities:
                    name = activity["activity"]
                    
                    try:
                        duration_float = (float(activity["duration"])+float(activity["travel"]))/60
                        if duration_float > 1:
                            h = "hours"
                        else:
                            h = "hour"
                        duration = f"{duration_float:.1f} {h}"
                    except:
                        duration = "Unknown"
                    
                    address = activity["address"]
                    body += f"{name} at {address} - Estimated duration: {duration}{rn}"
                body += f"{rn}"

        return body

    def prepare_email(self, destination, schedule):
        """
        Creates an email message and populate its fields according to the passed parameters

        Args:
            destination (str): Email address of the user requesting the schedule
            schedule (str): Textual version of the schedule
        
        Returns:
            EmailMessage: Object to be sent via a SMTP server 
        """
        current_time = arrow.now().format("YYYY-MM-DD")

        message = EmailMessage()
        message["Subject"] = f"{current_time} - Schedule"
        message["From"] = "Scheduler"
        message["To"] = f"{destination}"

        body = self.parse_schedule(schedule)

        message.set_content(body)

        return message

    def send_email(self, message):
        """
        Sends a message through SMTP, optionally with credentials if the server requires authentication

        Args:
            message (EmailMessage): The message in question

        Returns:
            bool: Flag indicating the success status of the sending.
        """
        if self.server_location: 
            server = smtplib.SMTP(self.server_location)
        else:
            return False
        
        if self.credentials:
            server.login(**self.credentials)
        else:
            return False

        server.send_message(message)

        server.quit()

        return True
