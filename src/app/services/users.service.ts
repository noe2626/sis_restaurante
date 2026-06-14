import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = environment.urlApi;

  constructor(private http: HttpClient) {}

  private getHeader() {
    const token = localStorage.getItem('userToken');
    return {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
  }

  getUsers() {
    return this.http.get(`${this.apiUrl}users`, this.getHeader());
  }

  createUser(user: any) {
    return this.http.post(`${this.apiUrl}users`, user, this.getHeader());
  }

  updateUser(id: number, user: any) {
    return this.http.put(`${this.apiUrl}users/${id}`, user, this.getHeader());
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.apiUrl}users/${id}`, this.getHeader());
  }

  getRoles() {
    return this.http.get(`${this.apiUrl}roles`, this.getHeader());
  }

  getAllSucursales() {
    return this.http.get(`${this.apiUrl}sucursales`, this.getHeader());
  }
}
