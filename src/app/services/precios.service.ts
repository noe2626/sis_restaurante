import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PreciosService {

  private apiUrl = environment.urlApi;

  constructor(private http: HttpClient) { }

  setPreciosSucursal(data: any) {
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    }
    return this.http.post(this.apiUrl + 'precioSucursal', data, header);
  }

  getPrecioProducto(idSucursal: any, idProducto: any) {
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    }
    return this.http.get(this.apiUrl + 'precioProducto/' + idSucursal + '/' + idProducto, header);
  }

  listarPrecios(idSucursal: any) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.get(`${this.apiUrl}precioSucursal/${idSucursal}`, header);
  }

  modificarPrecio(data: any, idSucursal: any) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.put(`${this.apiUrl}precioSucursal/${idSucursal}`, data, header);
  }

  obtenerPrecioFinal(idProducto: number, idSucursal: number, idCliente: number | null, cantidadComprada: number) {
    let token = localStorage.getItem('userToken');
    const header = {
        headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.post(`${this.apiUrl}pos/obtenerPrecioFinal`, {
        idProducto: idProducto,
        idSucursal: idSucursal,
        idCliente: idCliente,
        cantidad: cantidadComprada
    }, header);
}


  validarPromocionDinamica(idProducto: number, idSucursal: number, cantidadComprada: number) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.post(`${this.apiUrl}pos/validarPromocionDinamica`, {
      idProducto: idProducto,
      idSucursal: idSucursal,
      cantidad: cantidadComprada
    }, header);
  }



  obtenerPrecioBase(idProducto: number, idSucursal: number) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.post(`${this.apiUrl}pos/obtenerPrecioBase`, {
      idProducto: idProducto,
      idSucursal: idSucursal
    }, header);
  }




}
