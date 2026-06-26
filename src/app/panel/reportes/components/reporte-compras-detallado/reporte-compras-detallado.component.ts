import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ReportesService } from '../../../../services/reportes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reporte-compras-detallado',
  templateUrl: './reporte-compras-detallado.component.html',
  styleUrls: []
})
export class ReporteComprasDetalladoComponent implements OnChanges {
  @Input() fechaInicio!: string;
  @Input() fechaFin!: string;
  @Input() idSucursal!: number;
  @Input() idProducto!: number;
  @Input() idProveedor!: number;
  @Input() tipoPago!: string;

  loading = false;
  comprasDetalladasData: any[] = [];
  totalComprasDetallado: number = 0;
  cantidadComprasDetallado: number = 0;

  constructor(private reportesService: ReportesService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['fechaInicio'] ||
      changes['fechaFin'] ||
      changes['idSucursal'] ||
      changes['idProducto'] ||
      changes['idProveedor'] ||
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
    const provFilter = this.idProveedor !== 0 ? this.idProveedor : undefined;

    this.reportesService.obtenerReporteComprasDetallado(
      this.fechaInicio,
      this.fechaFin,
      filterSucursal,
      prodFilter,
      provFilter,
      this.tipoPago
    ).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response && response.success) {
          this.comprasDetalladasData = response.data || [];
          this.calcularTotalesCompras();
        } else {
          this.comprasDetalladasData = [];
          Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'No se pudieron obtener los datos.' });
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error al cargar reporte compras detallado:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error de Servidor',
          text: 'Ocurrió un error al cargar las estadísticas.'
        });
      }
    });
  }

  calcularTotalesCompras(): void {
    this.totalComprasDetallado = 0;
    this.cantidadComprasDetallado = 0;
    this.comprasDetalladasData.forEach(item => {
      this.totalComprasDetallado += item.total_compra || 0;
      this.cantidadComprasDetallado += item.cantidad_comprada || 0;
    });
  }

  imprimirReporte(): void {
    window.print();
  }
}
