import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class CajasService {

  private apiUrl = environment.urlApi;

  constructor(private http: HttpClient) { }

  getSucursalesByUsuario() {
    let token = localStorage.getItem('userToken');
    let idSucursal = localStorage.getItem('idSucursal');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    }
    return this.http.get(`${this.apiUrl}cajas/${idSucursal}`, header);
  }

  verificarCajas(idCaja:number) {
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    }
    return this.http.get(`${this.apiUrl}cajas/verificar/${idCaja}`, header);
  }

  abrirCaja(cantidad:number, idCaja:number){
    let token = localStorage.getItem('userToken');
    let idUsuario = CryptoJS.AES.decrypt(localStorage.getItem('idUsuario'), environment.secretKey).toString(CryptoJS.enc.Utf8);
    var header = {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    }
    return this.http.post(`${this.apiUrl}cajas/abrir`,
      {
        'idCaja':idCaja,
        'cantidad':cantidad,
        'idUser':idUsuario
      }, header);
  }

  depositar(idCaja:number, idUser:number, cantidad:number) {
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    }
    return this.http.post(`${this.apiUrl}cajas/depositar`, {idCaja, idUser, cantidad}, header);
  }

  retirar(idCaja:number, idUser:number, cantidad:number) {
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    }
    return this.http.post(`${this.apiUrl}cajas/retirar`, {idCaja, idUser, cantidad}, header);
  }

  cerrarSesion(idCaja:number) {
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    }
    return this.http.post(`${this.apiUrl}cajas/cerrar`, {idCaja}, header);
  }

}
