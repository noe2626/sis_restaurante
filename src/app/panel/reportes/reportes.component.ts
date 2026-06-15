import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { ReportesService } from '../../services/reportes.service';
import { SucursalesService } from '../../services/sucursales.service';
import { isPlatformBrowser } from '@angular/common';
import CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {

  fechaInicio: string = '';
  fechaFin: string = '';
  idSucursalSelected: number = 0;
  roleId: number = 0;
  sucursales: any[] = [];
  
  // Data de Reportes
  activeTab: string = 'general';
  reportData: any = null;
  cajasData: any[] = [];
  horasData: any[] = [];
  comprasData: any[] = [];
  maxHourlySales: number = 1;
  
  loading: boolean = false;

  constructor(
    private reportesService: ReportesService,
    private sucursalesService: SucursalesService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    // Establecer fechas por defecto (hoy)
    const today = this.formatDate(new Date());
    this.fechaInicio = today;
    this.fechaFin = today;

    if (isPlatformBrowser(this.platformId)) {
      // Obtener rol del usuario
      const encryptedIdTipo = localStorage.getItem('idTipo') || '';
      if (encryptedIdTipo) {
        try {
          this.roleId = parseInt(CryptoJS.AES.decrypt(encryptedIdTipo, environment.secretKey).toString(CryptoJS.enc.Utf8));
        } catch (e) {
          console.error('Error decrypting role in reportes:', e);
        }
      }

      // Obtener sucursal por defecto desde localStorage
      const localSucursal = localStorage.getItem('idSucursal');
      if (localSucursal) {
        this.idSucursalSelected = parseInt(localSucursal);
      }
    }

    this.cargarSucursales();
    this.cargarReporte();
  }

  formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  cargarSucursales(): void {
    this.sucursalesService.getSucursalesByUsuario().subscribe({
      next: (data: any) => {
        this.sucursales = data.data || data || [];
      },
      error: (err: any) => {
        console.error('Error al cargar sucursales:', err);
      }
    });
  }

  cargarReporte(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      Swal.fire({
        icon: 'warning',
        title: 'Fechas requeridas',
        text: 'Por favor seleccione fecha de inicio y fin.'
      });
      return;
    }

    this.loading = true;
    const filterSucursal = (this.idSucursalSelected && this.idSucursalSelected !== 0) ? this.idSucursalSelected : undefined;

    if (this.activeTab === 'general') {
      this.reportesService.obtenerReporte(this.fechaInicio, this.fechaFin, filterSucursal).subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response && response.success) {
            this.reportData = response.data;
          } else {
            this.reportData = null;
            Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'No se pudieron obtener los datos.' });
          }
        },
        error: (err: any) => { this.loading = false; this.handleError(err); }
      });
    } else if (this.activeTab === 'cajas') {
      this.reportesService.obtenerReporteCajas(this.fechaInicio, this.fechaFin, filterSucursal).subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response && response.success) {
            this.cajasData = response.data || [];
          } else {
            this.cajasData = [];
            Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'No se pudieron obtener los datos.' });
          }
        },
        error: (err: any) => { this.loading = false; this.handleError(err); }
      });
    } else if (this.activeTab === 'ventas-hora') {
      this.reportesService.obtenerReporteVentasHora(this.fechaInicio, this.fechaFin, filterSucursal).subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response && response.success) {
            this.horasData = response.data || [];
            this.maxHourlySales = Math.max(...this.horasData.map(h => h.pedidos), 1);
          } else {
            this.horasData = [];
            Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'No se pudieron obtener los datos.' });
          }
        },
        error: (err: any) => { this.loading = false; this.handleError(err); }
      });
    } else if (this.activeTab === 'compras-precios') {
      this.reportesService.obtenerReporteComprasPrecios(this.fechaInicio, this.fechaFin, filterSucursal).subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response && response.success) {
            this.comprasData = response.data || [];
          } else {
            this.comprasData = [];
            Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'No se pudieron obtener los datos.' });
          }
        },
        error: (err: any) => { this.loading = false; this.handleError(err); }
      });
    }
  }

  handleError(err: any) {
    console.error('Error al consultar reporte:', err);
    Swal.fire({
      icon: 'error',
      title: 'Error de Servidor',
      text: 'Ocurrió un error al cargar las estadísticas.'
    });
  }

  cambiarTab(tabName: string): void {
    this.activeTab = tabName;
    this.cargarReporte();
  }

  onFilterChange(): void {
    this.cargarReporte();
  }
}
