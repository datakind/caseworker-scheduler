# CBC Database Operations

## Setup a pgpass.conf file

1. Open up the command line
2. Change directories to the app data folder `cd %appdata%`
3. Make a postgres folder `mkdir postgresql`
4. Create a pgpass.conf file `touch pgpass.conf`
5. Using your favorite editor, enter the following line `localhost:5432:postgres:{username}:{password}` where `{username}` is replaced with your postgres username and `{password}` is replaced with your postgres password

## Load a table from iPython

Use the following snippet to load a table into postgres

```python
from cbc_database.dbops import DBOps
import pandas as pd

db = DBOps(user='postgres')
store = pd.HDFStore('Z:\For_CBC_Team\case_notes_data.h5')
df = store['cas_chron_type_semi']
# Take as subset of the data to test it out
test = df[:1000]
# Overwrite=True will overwrite the existing table
db.load_df_to_postgres(df, 'public', 'mytest', overwrite = False)
```

## Pull data from postgres

Use the following snippet to pull data from postgres

```python
from cbc_database.dbops import DBOps
import pandas as pd

db = DBOps(user='postgres')
# If no limit is chosen, the whole table is selected
df = db.get_table_from_postgres('public', 'mytest', limit=10)

sql = "SELECT * FROM public.mytest"
df = pd.read_sql(sql, con=db.pg_conn)
```
