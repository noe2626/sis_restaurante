import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MermasService {

  private apiUrl = environment.urlApi;

  constructor(private http: HttpClient) { }

  listarMermas(idSucursal: number) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.get(`${this.apiUrl}mermas/${idSucursal}`, header);
  }

  registrarMerma(merma: any) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.post(`${this.apiUrl}mermas`, merma, header);
  }

  eliminarMerma(id: number) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.delete(`${this.apiUrl}mermas/${id}`, header);
  }
}
