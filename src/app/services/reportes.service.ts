import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  private apiUrl = environment.urlApi;

  constructor(private http: HttpClient) { }

  obtenerReporte(fechaInicio: string, fechaFin: string, idSucursal?: number) {
    const token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };

    let params = new HttpParams()
      .set('fecha_inicio', fechaInicio)
      .set('fecha_fin', fechaFin);

    if (idSucursal) {
      params = params.set('idSucursal', idSucursal.toString());
    }

    return this.http.get(`${this.apiUrl}reportes`, { ...header, params });
  }

  obtenerReporteCajas(fechaInicio: string, fechaFin: string, idSucursal?: number) {
    const token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };

    let params = new HttpParams()
      .set('fecha_inicio', fechaInicio)
      .set('fecha_fin', fechaFin);

    if (idSucursal) {
      params = params.set('idSucursal', idSucursal.toString());
    }

    return this.http.get(`${this.apiUrl}reportes/cajas`, { ...header, params });
  }

  obtenerReporteVentasHora(fechaInicio: string, fechaFin: string, idSucursal?: number) {
    const token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };

    let params = new HttpParams()
      .set('fecha_inicio', fechaInicio)
      .set('fecha_fin', fechaFin);

    if (idSucursal) {
      params = params.set('idSucursal', idSucursal.toString());
    }

    return this.http.get(`${this.apiUrl}reportes/ventas-hora`, { ...header, params });
  }

  obtenerReporteComprasDetallado(fechaInicio: string, fechaFin: string, idSucursal?: number, idProducto?: number, idProveedor?: number) {
    const token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };

    let params = new HttpParams()
      .set('fecha_inicio', fechaInicio)
      .set('fecha_fin', fechaFin);

    if (idSucursal) {
      params = params.set('idSucursal', idSucursal.toString());
    }
    if (idProducto) {
      params = params.set('idProducto', idProducto.toString());
    }
    if (idProveedor) {
      params = params.set('idProveedor', idProveedor.toString());
    }

    return this.http.get(`${this.apiUrl}reportes/compras-detallado`, { ...header, params });
  }

  obtenerReporteVentasDetallado(fechaInicio: string, fechaFin: string, idSucursal?: number, idProducto?: number, idCliente?: number) {
    const token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };

    let params = new HttpParams()
      .set('fecha_inicio', fechaInicio)
      .set('fecha_fin', fechaFin);

    if (idSucursal) {
      params = params.set('idSucursal', idSucursal.toString());
    }
    if (idProducto) {
      params = params.set('idProducto', idProducto.toString());
    }
    if (idCliente) {
      params = params.set('idCliente', idCliente.toString());
    }

    return this.http.get(`${this.apiUrl}reportes/ventas-detallado`, { ...header, params });
  }

  obtenerReporteInventario(idSucursal?: number) {
    const token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };

    let params = new HttpParams();
    if (idSucursal) {
      params = params.set('idSucursal', idSucursal.toString());
    }

    return this.http.get(`${this.apiUrl}reportes/inventario`, { ...header, params });
  }
}
