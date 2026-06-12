import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { Router } from '@angular/router';

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

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idSuc = localStorage.getItem('idSucursal');
    if (!idSuc) {
      this.router.navigate(['/sucursales']);
      return;
    }
    
    this.idSucursal = parseInt(idSuc);
    this.sucursalNombre = localStorage.getItem('sucursal') || 'Sucursal';
    this.cargarDatos();
    this.prepararGrafica();
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
}
