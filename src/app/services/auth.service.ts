import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.urlApi;

  constructor(private http: HttpClient) {}

  login(user: { user: string; password: string }){
    return this.http.post(`${this.apiUrl}login`, user);
  }
}
