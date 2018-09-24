import { Component, OnInit } from '@angular/core';
import { icon, latLng, Map, marker, point, polyline, tileLayer } from 'leaflet';
import { ActivatedRoute } from '@angular/router';

import { Activity } from '../../shared/activity.model';
import { MyActivitiesService } from '../../services/my-activities.service';
import { UserIdService } from '../../services/user-id.service';
import { HTTPService } from '../../services/http.service';

@Component({
    selector: 'app-leaflet',
    templateUrl: './leaflet.component.html',
    styleUrls: ['./leaflet.component.css']
})
export class LeafletComponent implements OnInit{
  activities: Activity[];
  start: Activity = new Activity(
    null, null, null, null, null, null, null, null, null, null
  );
  end: Activity = new Activity(
    null, null, null, null, null, null, null, null, null, null
  );
  userId: string;
  layers = [];
  private sub: any;
  googleMaps;
  googleHybrid;
  options;
  endMarker;
  startMarker;
  layersControl;
  cbcEnd;
  cbcStart;

  constructor(
    private myActivitiesService: MyActivitiesService,
    private activatedRoute: ActivatedRoute,
    private userIdService: UserIdService,
    private httpService: HTTPService
   ) { }

  ngOnInit() {
    this.sub = this.activatedRoute.params.subscribe(params=>{
      this.userId = params['userId'];
      this.userIdService.setUserId(this.userId);
    });

    this.getActivities(this.userId);
    this.myActivitiesService.activitiesChanged.subscribe(
      (activities: Activity[]) => {
        this.activities = activities;
      }
    );

    this.getEndpoint(this.userId, 'Start')
    this.myActivitiesService.startChanged.subscribe(
      (start: Activity) => {
        this.start = start;
      }
    );
    
    this.getEndpoint(this.userId, 'Finish')
    this.myActivitiesService.startChanged.subscribe(
      (end: Activity) => {
        this.end = end;
      }
    );
    
    this.renderMap();
  }

  renderMap(){
    // Define our base layers so we can reference them multiple times
    this.googleMaps = tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      detectRetina: true
    });
    this.googleHybrid = tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      detectRetina: true
    });

    // Layers control object with our two base layers 
    this.layersControl = {
      baseLayers: {
        'Google Maps': this.googleMaps,
        'Google Hybrid': this.googleHybrid
      }
    };

    var layers = [];
    layers.push(this.googleMaps);
    for(var i=0; i<this.layers.length; i++){
      layers.push(this.layers[i]);
    }
    this.options = {
      zoom: 10,
      layers: layers,
      center: latLng([ 28.5363686, -81.379765 ])
    };
  }

  getActivities(userId: string){
    this.httpService.getActivities(userId)
      .subscribe(
        (data) => {
          var activities = [];
          for(var i=0; i<data.length; i++){
            var completed = data[i].completed == "1";
            var activity = new Activity(
              parseInt(data[i].id),
              data[i].caseName,
              data[i].activityType,
              data[i].expectedDuration,
              data[i].address,
              data[i].city,
              data[i].state,
              data[i].zipCode,
              [data[i].coordinates[0], data[i].coordinates[1]],
              completed
            )
            activities.push(activity);
          }
          this.activities = activities;
          this.myActivitiesService.setActivities(activities);
          var layers = [];
          for(var i = 0; i < this.activities.length; i++){
            var lat = this.activities[i].coordinates[0];
            var lng = this.activities[i].coordinates[1];
            var caseName = this.activities[i].caseName;
            var activityType = this.activities[i].activityType;
            var title = caseName + ' ' + activityType;
            var mark = marker(
              [ lat, lng ], 
              {
                title: title,
                riseOnHover: true,
                icon: icon({
                  iconSize: [ 25, 41 ],
                  iconAnchor: [ 13, 41 ],
                  iconUrl: '../../assets/marker-icon.png',
                  shadowUrl: 'leaflet/marker-shadow.png',
              })
            });
            var name = this.activities[i].caseName + ' ' + this.activities[i].activityType;
            this.layers.push(mark);  
          }
        },
        (error) => console.log(error)
    );
  }

  getEndpoint(userId: string, type: string){
    this.httpService.getEndpoint(userId, type)
      .subscribe(
        (data) => {
          var location = new Activity(
            null,
            null,
            null,
            null,
            data.address,
            data.city,
            data.state,
            data.zipCode,
            [data.coordinates[0], data.coordinates[1]],
            null
          )
          if(type==='Start'){
           this.start = location;
           this.myActivitiesService.setStart(location);
          }
          else if(type ==='Finish'){
           this.end = location;
           this.myActivitiesService.setEnd(location);
          }
          var mark = marker(
               [ 
                 location.coordinates[0],
                 location.coordinates[1]
               ], 
               {
                 title: type,
                 icon: icon({
                   iconSize: [ 25, 41 ],
                   iconAnchor: [ 13, 41 ],
                   iconUrl: '../../assets/marker-icon.png',
                   shadowUrl: 'leaflet/marker-shadow.png'
               })
           });
           this.layers.push(mark);
        },
        (error) => console.log(error)
    );
  }

 }

