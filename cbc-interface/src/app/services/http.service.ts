import { Injectable } from '@angular/core';
import { Headers, Http, Response, URLSearchParams } from '@angular/http';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Observable';

import { Activity } from '../shared/activity.model';

declare function require(name:string);
const config = require('../shared/config.json');
let BASE_URL = config.url;

@Injectable()
export class HTTPService {
  constructor(private http: Http) {}

  convertAddress(street: string, city: string, state: string, zipCode: string){
    let url = BASE_URL + '/cbc_datakind/api/v1.0/convert_address';
    let params: URLSearchParams = new URLSearchParams();
    params.set('street', street);
    params.set('city', city);
    params.set('state', state);
    params.set('zipCode', zipCode);
    return this.http.get(url, {search: params})
      .map(
        (response: Response) => {
          const data = response.json();
          console.log(data);
          return data.coordinates;
        }
      )
      .catch(
        (error: Response) => {
          return Observable.throw('Something went wrong');
        }
      );
  }

  testAPI(){
    let url = BASE_URL + '/cbc_datakind/api/v1.0/test';
    let params: URLSearchParams = new URLSearchParams();
    return this.http.get(url, {search: params})
      .map(
        (response: Response) => {
          const data = response.json();
          console.log(data);
          return data;
        }
      )
      .catch(
        (error: Response) => {
          return Observable.throw('Something went wrong');
        }
      );
  }
  
  getActivities(userId: string){
    let url = BASE_URL + '/cbc_datakind/api/v1.0/activities';
    let params: URLSearchParams = new URLSearchParams();
    params.set('userId', userId);
    return this.http.get(url, {search: params})
      .map(
        (response: Response) => {
          const data = response.json();
          console.log(data);
          return data;
        }
      )
      .catch(
        (error: Response) => {
          return Observable.throw('Something went wrong');
        }
      );
  }

  addActivity(activity: Activity, userId: string){
    // Serialize the activity as a json object
    let newActivity = {
      "userId": userId,
      "id": activity.id,
      "caseName": activity.caseName,
      "activityType": activity.activityType,
      "expectedDuration": activity.expectedDuration,
      "address": activity.address,
      "city": activity.city,
      "state": activity.state,
      "zipCode": activity.zipCode,
      "coordinates": activity.coordinates,
      "completed":activity.completed 
    }

    let url = BASE_URL + '/cbc_datakind/api/v1.0/activity';
    return this.http.post(url, newActivity)
      .map(
        (response: Response) => {
          const data = response.json();
          return data
        }
      )
      .catch(
        (error: Response) => {
          return Observable.throw('Something went wrong');
        }
      );
  }

  deleteActivity(userId: string, id: string){
    let url = BASE_URL + '/cbc_datakind/api/v1.0/activity';
    let params: URLSearchParams = new URLSearchParams();
    params.set('userId', userId);
    params.set('id', id);
    console.log(userId, id);
    return this.http.delete(url, {search: params})
      .map(
        (response: Response) => {
          const data = response.json();
          return data
        }
      )
      .catch(
        (error: Response) => {
          return Observable.throw('Something went wrong');
        }
      );
  }

  getEndpoint(userId: string, endpoint: string){
    let url = BASE_URL + '/cbc_datakind/api/v1.0/endpoint';
    let params: URLSearchParams = new URLSearchParams();
    params.set('userId', userId);
    params.set('endpoint', endpoint);
    return this.http.get(url, {search: params})
      .map(
        (response: Response) => {
          const data = response.json();
          console.log(data);
          return data;
        }
      )
      .catch(
        (error: Response) => {
          return Observable.throw('Something went wrong');
        }
      );
  }

  updateEndpoint(location: Activity, userId: string, endpoint: string){
    // Serialize the activity as a json object
    let updatedEndpoint = {
      "userId": userId,
      "endpoint": endpoint,
      "address": location.address,
      "city": location.city,
      "state": location.state,
      "zipCode": location.zipCode,
      "coordinates": location.coordinates,
    }

    let url = BASE_URL + '/cbc_datakind/api/v1.0/endpoint';
    return this.http.post(url, updatedEndpoint)
      .map(
        (response: Response) => {
          const data = response.json();
          return data
        }
      )
      .catch(
        (error: Response) => {
          return Observable.throw('Something went wrong');
        }
      );
  }

  getSavedSchedule(userId: string){
    let url = BASE_URL + '/cbc_datakind/api/v1.0/saved_schedule';
    let params: URLSearchParams = new URLSearchParams();
    params.set('userId', userId);
    return this.http.get(url, {search: params})
      .map(
        (response: Response) => {
          const data = response.json();
          console.log(data);
          return data;
        }
      )
      .catch(
        (error: Response) => {
          return Observable.throw('Something went wrong');
        }
      );
  }

  updateSavedSchedule(schedule, userId: string){
    let url = BASE_URL + '/cbc_datakind/api/v1.0/saved_schedule';
    return this.http.post(url, schedule)
      .map(
        (response: Response) => {
          const data = response.json();
          return data
        }
      )
      .catch(
        (error: Response) => {
          return Observable.throw('Something went wrong');
        }
      );
  }  

  emailSchedule(schedule){
    let url = BASE_URL + '/cbc_datakind/api/v1.0/email';
    return this.http.post(url, schedule)
      .map(
        (response: Response) => {
          const data = response.json();
          return data
        }
      )
      .catch(
        (error: Response) => {
          return Observable.throw('Something went wrong');
        }
      );
  }

  postMetrics(userId, action){
    let url = BASE_URL + '/cbc_datakind/api/v1.0/usage';
    url += '?userId=' + userId;
    url += '&action=' + action;
    return this.http.post(url, null)
      .map(
        (response: Response) => {
          const data = response.json();
          console.log(data);
          return data;
        }
      )
      .catch(
        (error: Response) => {
          return Observable.throw('Something went wrong');
        }
      );  
  }
  
}
