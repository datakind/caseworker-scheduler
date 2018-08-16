import { Component } from '@angular/core';
import {  Router } from '@angular/router';

import { UserIdService } from '../services/user-id.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  userId: string;

  constructor(
    private userIdService: UserIdService,
    private router: Router
  ) { }

  ngOnInit() {
    this.userId = this.userIdService.getUserId();
    this.userIdService.userIdChanged.subscribe(
      (userId: string) => {
        this.userId = userId;
      }
    )
  }

  onNavigate(base){
    this.router.navigate([base, this.userId]);
  }
}
