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

  getActiveSession(idSucursal: number) {
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    }
    return this.http.get(`${this.apiUrl}cajas/active-session/${idSucursal}`, header);
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

  retirar(idCaja:any, idUser:any, cantidad:number, authUser?: string, authPassword?: string, concepto?: string) {
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    }
    return this.http.post(`${this.apiUrl}cajas/retirar`, {
      idCaja,
      idUser,
      cantidad,
      auth_user: authUser,
      auth_password: authPassword,
      concepto
    }, header);
  }

  getResumenCierre(idCaja: number) {
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    }
    return this.http.get(`${this.apiUrl}cajas/resumen-cierre/${idCaja}`, header);
  }

  cerrarSesion(idCaja: number, cantidadCierre: number, desglose: any, notas: string, retiroCierre: number) {
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    }
    return this.http.post(`${this.apiUrl}cajas/cerrar`, { idCaja, cantidad_cierre: cantidadCierre, desglose, notas, retiro_cierre: retiroCierre }, header);
  }

  getAllCajas() {
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    }
    return this.http.get(`${this.apiUrl}admin/cajas`, header);
  }

  createCaja(payload: any) {
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    }
    return this.http.post(`${this.apiUrl}admin/cajas`, payload, header);
  }

  updateCaja(id: number, payload: any) {
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    }
    return this.http.put(`${this.apiUrl}admin/cajas/${id}`, payload, header);
  }

  deleteCaja(id: number) {
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    }
    return this.http.delete(`${this.apiUrl}admin/cajas/${id}`, header);
  }

}
