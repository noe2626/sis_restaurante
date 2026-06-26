import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ReportesService } from '../../../../services/reportes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reporte-general',
  templateUrl: './reporte-general.component.html',
  styleUrls: []
})
export class ReporteGeneralComponent implements OnChanges {
  @Input() fechaInicio!: string;
  @Input() fechaFin!: string;
  @Input() idSucursal!: number;

  loading = false;
  reportData: any = null;

  constructor(private reportesService: ReportesService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fechaInicio'] || changes['fechaFin'] || changes['idSucursal']) {
      this.cargarReporte();
    }
  }

  cargarReporte(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      return;
    }

    this.loading = true;
    const filterSucursal = this.idSucursal !== 0 ? this.idSucursal : undefined;

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
      error: (err: any) => {
        this.loading = false;
        console.error('Error al consultar reporte general:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error de Servidor',
          text: 'Ocurrió un error al cargar el resumen general.'
        });
      }
    });
  }
}
