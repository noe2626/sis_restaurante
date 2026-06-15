import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { CajasService } from '../../services/cajas.service';
import { VentasService } from '../../services/ventas.service';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  idSucursal: number = 0;
  sucursalNombre: string = '';
  dashboardData: any = null;
  loading: boolean = true;
  error: string | null = null;

  // Propiedades para la gráfica circular SVG
  efectivoPct: number = 0;
  tarjetaPct: number = 0;
  transferenciaPct: number = 0;

  dashArrayEfectivo: string = '0 100';
  dashOffsetEfectivo: string = '100';
  dashArrayTarjeta: string = '0 100';
  dashOffsetTarjeta: string = '100';
  dashArrayTransferencia: string = '0 100';
  dashOffsetTransferencia: string = '100';

  // KPIs
  ticketPromedio: number = 0;
  balanceNeto: number = 0;

  metricasY: number[] = [];
  maxVentas = 0;

  // Propiedades para Cajeros
  roleId: number = 0;
  activeSession: any = null;
  cajaNombre: string = '';
  cajaSessionData: any = null;
  turnoVentas: any[] = [];
  ventaSeleccionada: any = null;
  loadingVentas: boolean = false;

  constructor(
    private dashboardService: DashboardService,
    private cajasService: CajasService,
    private ventasService: VentasService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const idSuc = localStorage.getItem('idSucursal');
      if (!idSuc) {
        this.router.navigate(['/sucursales']);
        return;
      }
      
      this.idSucursal = parseInt(idSuc);
      this.sucursalNombre = localStorage.getItem('sucursal') || 'Sucursal';

      // Descifrar Rol
      this.roleId = this.getDecryptedRole();

      if (this.roleId === 3) {
        this.cargarDatosCajero();
      } else {
        this.cargarDatos();
      }
    }
  }

  prepararGrafica(): void {

    const maxVentas = Math.max(
      ...this.dashboardData.ventas_por_hora.map((x: any) => x.total),
      1
    );

    this.dashboardData.ventas_por_hora =
      this.dashboardData.ventas_por_hora.map((item: any) => ({
        ...item,
        percentage: (item.total / maxVentas) * 100
      }));

    this.metricasY = [
      maxVentas,
      maxVentas * 0.8,
      maxVentas * 0.6,
      maxVentas * 0.4,
      maxVentas * 0.2,
      0
    ];
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = null;
    this.dashboardService.getResumenDashboard(this.idSucursal).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.dashboardData = res.data;
          this.calcularGraficas();
        } else {
          this.error = 'No se pudieron cargar los datos del servidor.';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos del dashboard:', err);
        this.error = 'Ocurrió un error al cargar la información. Intenta de nuevo más tarde.';
        this.loading = false;
      }
    });
  }

  calcularGraficas(): void {
    if (!this.dashboardData) return;

    // 1. Gráfica de Barras: Escalar alturas según la venta máxima
    const maxTotal = Math.max(...this.dashboardData.ventas_por_hora.map((item: any) => item.total), 0);
    this.dashboardData.ventas_por_hora.forEach((item: any) => {
      item.percentage = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
    });

    // 2. Gráfica Circular (Donut SVG)
    const totalVentas = this.dashboardData.total_ventas_hoy;
    
    if (totalVentas > 0) {
      const e = this.dashboardData.ventas_por_metodo.efectivo;
      const t = this.dashboardData.ventas_por_metodo.tarjeta;
      const tr = this.dashboardData.ventas_por_metodo.transferencia;

      this.efectivoPct = (e / totalVentas) * 100;
      this.tarjetaPct = (t / totalVentas) * 100;
      this.transferenciaPct = (tr / totalVentas) * 100;

      // Segmentos del Donut (circunferencia = 100)
      this.dashArrayEfectivo = `${this.efectivoPct} ${100 - this.efectivoPct}`;
      this.dashOffsetEfectivo = '100'; // Empieza en 0 (offset 100)

      this.dashArrayTarjeta = `${this.tarjetaPct} ${100 - this.tarjetaPct}`;
      this.dashOffsetTarjeta = `${100 - this.efectivoPct}`;

      this.dashArrayTransferencia = `${this.transferenciaPct} ${100 - this.transferenciaPct}`;
      this.dashOffsetTransferencia = `${100 - this.efectivoPct - this.tarjetaPct}`;
    } else {
      this.efectivoPct = 0;
      this.tarjetaPct = 0;
      this.transferenciaPct = 0;
      
      this.dashArrayEfectivo = '0 100';
      this.dashOffsetEfectivo = '100';
      this.dashArrayTarjeta = '0 100';
      this.dashOffsetTarjeta = '100';
      this.dashArrayTransferencia = '0 100';
      this.dashOffsetTransferencia = '100';
    }

    // 3. Calcular KPIs
    this.ticketPromedio = this.dashboardData.cantidad_ventas_hoy > 0 
      ? this.dashboardData.total_ventas_hoy / this.dashboardData.cantidad_ventas_hoy 
      : 0;
    this.balanceNeto = this.dashboardData.total_ventas_hoy - this.dashboardData.total_compras_hoy;
  }

  getDecryptedRole(): number {
    const encryptedIdTipo = localStorage.getItem('idTipo') || '';
    if (encryptedIdTipo) {
      try {
        return parseInt(CryptoJS.AES.decrypt(encryptedIdTipo, environment.secretKey).toString(CryptoJS.enc.Utf8)) || 3;
      } catch (e) {
        console.error('Error decrypting role in dashboard:', e);
      }
    }
    return 3;
  }

  cargarDatosCajero(): void {
    this.loading = true;
    this.error = null;
    this.cajaSessionData = null;
    this.turnoVentas = [];

    // 1. Obtener sesión activa de caja
    this.cajasService.getActiveSession(this.idSucursal).subscribe({
      next: (res: any) => {
        if (res && res.success && res.data) {
          this.activeSession = res.data;
          this.cajaNombre = res.data.caja || 'Caja';
          const idCaja = res.data.idCaja;
          
          // Guardar idCaja cifrado en localStorage
          const encryptedIdCaja = CryptoJS.AES.encrypt(idCaja.toString(), environment.secretKey).toString();
          localStorage.setItem('idCaja', encryptedIdCaja);
          localStorage.setItem('caja', this.cajaNombre);

          // 2. Obtener balance/resumen del arqueo activo
          this.cajasService.getResumenCierre(idCaja).subscribe({
            next: (resResumen: any) => {
              if (resResumen && resResumen.success) {
                this.cajaSessionData = resResumen.data;
                
                // 3. Obtener y filtrar ventas del turno
                this.cargarVentasTurno();
              } else {
                this.error = 'No se pudo obtener el resumen financiero de la caja.';
                this.loading = false;
              }
            },
            error: (err) => {
              console.error('Error al obtener resumen de cierre:', err);
              this.error = 'Ocurrió un error al obtener la información financiera del turno.';
              this.loading = false;
            }
          });
        } else {
          // Sin sesión activa
          this.activeSession = null;
          localStorage.removeItem('idCaja');
          localStorage.removeItem('caja');
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error al verificar sesión activa:', err);
        this.error = 'Error al comunicarse con el servidor para validar el estado de tu caja.';
        this.loading = false;
      }
    });
  }

  cargarVentasTurno(): void {
    if (!this.cajaSessionData) return;
    this.loadingVentas = true;

    this.ventasService.listarVentas().subscribe({
      next: (res: any) => {
        let allVentas = [];
        if (res && res.success) {
          allVentas = res.data || [];
        } else if (Array.isArray(res)) {
          allVentas = res;
        }

        // Filtrar por cajero y fecha de apertura
        const aperturaDate = new Date(this.cajaSessionData.fecha_apertura);
        this.turnoVentas = allVentas.filter((venta: any) => {
          const esCajero = venta.usuario_nombre === this.cajaSessionData.cajero;
          const esDespuesApertura = new Date(venta.fecha) >= aperturaDate;
          return esCajero && esDespuesApertura;
        });

        this.loadingVentas = false;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al listar ventas para cajero:', err);
        this.loadingVentas = false;
        this.loading = false;
      }
    });
  }

  verDetalle(id: number): void {
    this.ventasService.obtenerDetalleVenta(id).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.ventaSeleccionada = res.data;
          const modalElement = document.getElementById('detalleVentaModal');
          if (modalElement) {
            const bootstrap = (window as any).bootstrap;
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
          }
        } else {
          Swal.fire('Error', 'No se pudo obtener el detalle de la venta.', 'error');
        }
      },
      error: (err) => {
        console.error('Error al obtener el detalle de la venta:', err);
        Swal.fire('Error', 'Hubo un error al comunicarse con el servidor.', 'error');
      }
    });
  }
}
