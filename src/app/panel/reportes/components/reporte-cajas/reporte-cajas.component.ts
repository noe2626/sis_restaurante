import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ReportesService } from '../../../../services/reportes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reporte-cajas',
  templateUrl: './reporte-cajas.component.html',
  styleUrls: []
})
export class ReporteCajasComponent implements OnChanges {
  @Input() fechaInicio!: string;
  @Input() fechaFin!: string;
  @Input() idSucursal!: number;

  loading = false;
  cajasData: any[] = [];

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
      error: (err: any) => {
        this.loading = false;
        console.error('Error al consultar auditoria de cajas:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error de Servidor',
          text: 'Ocurrió un error al cargar los arqueos.'
        });
      }
    });
  }

  verRetiros(item: any): void {
    if (!item.retiros || item.retiros.length === 0) {
      Swal.fire({
        title: 'Sin retiros',
        text: 'No se encontraron retiros en esta sesión de caja.',
        icon: 'info'
      });
      return;
    }

    let htmlContent = `
      <div class="table-responsive text-start fs-7">
        <table class="table table-lg table-striped align-middle">
          <thead>
            <tr class="table-light fw-bold" style="font-size: 0.85rem;">
              <th>Fecha</th>
              <th class="text-end">Monto</th>
              <th>Concepto</th>
              <th>Autorizó</th>
            </tr>
          </thead>
          <tbody>
    `;

    item.retiros.forEach((ret: any) => {
      const dateFormatted = new Date(ret.fecha).toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const amountFormatted = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(ret.cantidad);

      htmlContent += `
        <tr style="font-size: 0.85rem;">
          <td>${dateFormatted}</td>
          <td class="text-end text-danger fw-bold">${amountFormatted}</td>
          <td>${ret.concepto || 'Sin concepto'}</td>
          <td><span class="badge bg-secondary">${ret.usuario_nombre || 'Desconocido'}</span></td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
      </div>
    `;

    Swal.fire({
      title: `Retiros de Caja - ${item.caja_nombre}`,
      html: htmlContent,
      width: '70%',
      showConfirmButton: true,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3085d6'
    });
  }
}
