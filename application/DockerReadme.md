# Docker Run Instructions

## Steps to run the docker
1. Open terminal inside the `caseworker-scheduler` directory (docker1 branch)
2. Build the image from the docker file 

    `$ docker build -t "casescheduler:dockerfile" .`
3. Run the image 
    
    `$ docker run -it -p 80:80 --security-opt apparmor=unconfined  casescheduler:dockerfile`
    * Note: `--security-opt apparmor=unconfined` because apparmor runs on port 80 by default and we need port 80.
4. Once you are in the image you need to provide the CBC_API access to a Bing Maps API key. If you need to get an API key go  [here](https://msdn.microsoft.com/en-us/library/ff428642.aspx). Once you have your key execute the following in the terminal

     `$ export MSDN_KEY=<your api key>`
4. Then run the bash script `run_me_first.sh`

    `$ sh run_me_first.sh`


## Todo
1. Error or two in the browser console. Not sure these matter. 
2. The travel times seem real low - why is that? 
