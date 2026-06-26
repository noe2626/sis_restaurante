import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ReportesService } from '../../../../services/reportes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reporte-ventas-detallado',
  templateUrl: './reporte-ventas-detallado.component.html',
  styleUrls: []
})
export class ReporteVentasDetalladoComponent implements OnChanges {
  @Input() fechaInicio!: string;
  @Input() fechaFin!: string;
  @Input() idSucursal!: number;
  @Input() idProducto!: number;
  @Input() idCliente!: number;
  @Input() tipoPago!: string;

  loading = false;
  ventasDetalladasData: any[] = [];
  totalVentasDetallado: number = 0;
  cantidadVentasDetallado: number = 0;

  constructor(private reportesService: ReportesService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['fechaInicio'] ||
      changes['fechaFin'] ||
      changes['idSucursal'] ||
      changes['idProducto'] ||
      changes['idCliente'] ||
      changes['tipoPago']
    ) {
      this.cargarReporte();
    }
  }

  cargarReporte(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      return;
    }

    this.loading = true;
    const filterSucursal = this.idSucursal !== 0 ? this.idSucursal : undefined;
    const prodFilter = this.idProducto !== 0 ? this.idProducto : undefined;
    const clientFilter = this.idCliente !== 0 ? this.idCliente : undefined;

    this.reportesService.obtenerReporteVentasDetallado(
      this.fechaInicio,
      this.fechaFin,
      filterSucursal,
      prodFilter,
      clientFilter,
      this.tipoPago
    ).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response && response.success) {
          this.ventasDetalladasData = response.data || [];
          this.calcularTotalesVentas();
        } else {
          this.ventasDetalladasData = [];
          Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'No se pudieron obtener los datos.' });
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error al cargar reporte ventas detallado:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error de Servidor',
          text: 'Ocurrió un error al cargar las estadísticas.'
        });
      }
    });
  }

  calcularTotalesVentas(): void {
    this.totalVentasDetallado = 0;
    this.cantidadVentasDetallado = 0;
    this.ventasDetalladasData.forEach(item => {
      this.totalVentasDetallado += item.total_venta || 0;
      this.cantidadVentasDetallado += item.cantidad_vendida || 0;
    });
  }

  imprimirReporte(): void {
    window.print();
  }
}
