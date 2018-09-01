import { EventEmitter } from '@angular/core';

export class UserIdService {
  userId: string;
  userIdChanged = new EventEmitter<string>();

  getUserId(){
    return this.userId;
  }

  setUserId(userId){
    this.userId = userId;
    console.log(this.userId);
    this.userIdChanged.emit(this.userId);
  }

}
