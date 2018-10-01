from setuptools import setup, find_packages

reqs = [
    'arrow',
    'click',
    'daiquiri',
    'eventlet',
    'flask',
    'flask-socketio',
    'geopy',
    'googlemaps',
    'pytest',
    'networkx',
    'numpy',
    'scipy',
    'sklearn',
    'pymysql',
    'pyschedule>=0.2.16'
]

test_reqs = ['pytest', 'pytest-sugar', 'pytest-cov', 'pylint']

setup(
    name='cbc_api',
    description='API for the CBC app',
    author='CBC Datakind Team',
    author_email='michael@datakind.org',
    packages=find_packages(),
    version='0.1.1',
    install_requires=reqs,
    extras_require={
        'test': test_reqs
    },
    entry_points = {
        "console_scripts":"cbc_api=cbc_api.__main__:main"
    },
    package_data={'cbc_api':['*.json']}
)
