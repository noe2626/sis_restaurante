import { Component, Input, OnChanges, OnDestroy, SimpleChanges, Inject, PLATFORM_ID } from '@angular/core';
import { ReportesService } from '../../../../services/reportes.service';
import { isPlatformBrowser } from '@angular/common';
import Swal from 'sweetalert2';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-reporte-ventas-analisis',
  templateUrl: './reporte-ventas-analisis.component.html',
  styleUrls: []
})
export class ReporteVentasAnalisisComponent implements OnChanges, OnDestroy {
  @Input() fechaInicio!: string;
  @Input() fechaFin!: string;
  @Input() idSucursal!: number;
  @Input() sidebarCollapsed: boolean = false;

  loading = false;
  ventasDiaData: any[] = [];
  horasData: any[] = [];
  maxHourlySales: number = 1;
  salesChart: any = null;

  constructor(
    private reportesService: ReportesService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fechaInicio'] || changes['fechaFin'] || changes['idSucursal']) {
      this.cargarReporte();
    }
    if (changes['sidebarCollapsed'] && this.salesChart) {
      setTimeout(() => {
        this.salesChart.resize();
      }, 310);
    }
  }

  cargarReporte(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      return;
    }

    this.loading = true;
    const filterSucursal = this.idSucursal !== 0 ? this.idSucursal : undefined;

    this.reportesService.obtenerReporteVentasDia(this.fechaInicio, this.fechaFin, filterSucursal).subscribe({
      next: (diaRes: any) => {
        if (diaRes && diaRes.success) {
          this.ventasDiaData = diaRes.data || [];
          
          this.reportesService.obtenerReporteVentasHora(this.fechaInicio, this.fechaFin, filterSucursal).subscribe({
            next: (horaRes: any) => {
              this.loading = false;
              if (horaRes && horaRes.success) {
                this.horasData = horaRes.data || [];
                this.maxHourlySales = Math.max(...this.horasData.map(h => h.pedidos), 1);
                setTimeout(() => {
                  this.inicializarGraficaVentas();
                }, 50);
              } else {
                this.horasData = [];
                Swal.fire({ icon: 'error', title: 'Error', text: horaRes.message || 'No se pudieron obtener las ventas por hora.' });
              }
            },
            error: (err: any) => { this.loading = false; this.handleError(err); }
          });
        } else {
          this.loading = false;
          this.ventasDiaData = [];
          Swal.fire({ icon: 'error', title: 'Error', text: diaRes.message || 'No se pudieron obtener las ventas por día.' });
        }
      },
      error: (err: any) => { this.loading = false; this.handleError(err); }
    });
  }

  handleError(err: any): void {
    console.error('Error al cargar análisis de ventas:', err);
    Swal.fire({
      icon: 'error',
      title: 'Error de Servidor',
      text: 'Ocurrió un error al cargar las estadísticas.'
    });
  }

  inicializarGraficaVentas(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const ctx = document.getElementById('salesLineChart') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('Canvas para gráfica lineal de ventas no encontrado.');
      return;
    }

    if (this.salesChart) {
      this.salesChart.destroy();
    }

    const labels = this.ventasDiaData.map(d => {
      const parts = d.fecha.split('-');
      if (parts.length === 3) {
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const mesIndex = parseInt(parts[1], 10) - 1;
        return `${parts[2]} ${meses[mesIndex]}`;
      }
      return d.fecha;
    });

    const montos = this.ventasDiaData.map(d => d.monto);
    const pedidos = this.ventasDiaData.map(d => d.pedidos);

    this.salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Monto de Ventas ($)',
            data: montos,
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Número de Pedidos',
            data: pedidos,
            borderColor: '#0d6efd',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.3,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                weight: 'bold'
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                const val = context.parsed.y ?? 0;
                if (context.datasetIndex === 0) {
                  label += new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
                } else {
                  label += val;
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11
              }
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Monto Facturado ($)',
              font: {
                weight: 'bold'
              }
            },
            ticks: {
              callback: function(value) {
                return '$' + value;
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Cantidad de Pedidos',
              font: {
                weight: 'bold'
              }
            },
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  imprimirReporte(): void {
    window.print();
  }

  ngOnDestroy(): void {
    if (this.salesChart) {
      this.salesChart.destroy();
    }
  }
}
