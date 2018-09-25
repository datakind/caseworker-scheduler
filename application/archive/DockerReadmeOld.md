# Docker Run Instructions

## Steps to run the docker as its currently setup
1. Open terminal (A) inside the caseworker-scheduler (docker1 branch)
2. Build the image from the docker file `docker build -t "casescheduler:dockerfile" .`
3. Run the image `docker run -it -p 80:80 --security-opt apparmor=unconfined  casescheduler:dockerfile`
    * `--security-opt apparmor=unconfined` because it runs on port 80 by default.
4. Once you are in the image run the bash script run_me_first 
`sh run_me_first.sh`
    * Bash file is because these commands/configs were not saved in the docker build, but there must be a way to integrate this step...not sure how. 
5. In a new terminal window - Get the container id: `docker ps`, copy the id for the `casescheduler`. We will call the id $containerid.
5. In the a second terminal window (Window B): in this window 
```
docker exec  -it $containerid bash (allows us to log into same container)
cd cbc-interface;
ng serve
```
    * Can we also start these things all in one terminal ?  
6. Open up a third terminal window (Window C): in this window
```
docker exec  -it $containerid bash (allows us to log into same container)
cd cbc_api
cbc_api launch --debug
```
    * Can we also start these things all in one terminal ?  
7. In terminal A run `nginx`
8. Now open http://localhost:80


## Todo
1. It appears to be working - but i do see an error or two in the browser console. Not sure these matter. 
2. The travel times seem real low - why is that? 
3. Clean up the docker setup - i'm sure it can be done better... (but you know)
4. Remove my bing key and add a step for people to add theirs. 
