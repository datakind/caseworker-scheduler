from setuptools import setup, find_packages

reqs = [
    'click',
    'pandas',
    'psycopg2',
]

setup(
    name='cbc_database',
    description='tools for handling database connections',
    author='CBC Datakind Team',
    packages=find_packages(),
    version='0.1.0',
    install_requires=reqs,
    entry_points = {
        "console_scripts":"cbc_database=cbc_database.__main__:main"
    }
)