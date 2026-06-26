import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { ReportesService } from '../../../../services/reportes.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reporte-historico-inventario',
  templateUrl: './reporte-historico-inventario.component.html',
  styleUrls: []
})
export class ReporteHistoricoInventarioComponent implements OnChanges {
  @Input() fechaInicio!: string;
  @Input() fechaFin!: string;
  @Input() idSucursal!: number;
  @Input() idProducto!: number;
  @Input() roleId!: number;

  loading = false;
  historicoData: any[] = [];
  historicoDataSource = new MatTableDataSource<any>([]);
  filterValuesHistorico: any = { fecha: '', sucursal_nombre: '', producto_nombre: '', producto_codigo: '', unidad_medida: '', cantidad_stock: '', momento: '' };

  private historicoPaginator: MatPaginator | null = null;
  private historicoSort: MatSort | null = null;

  @ViewChild('historicoPaginator') set histPaginator(paginator: MatPaginator) {
    if (paginator) {
      this.historicoPaginator = paginator;
      this.historicoDataSource.paginator = paginator;
    }
  }

  @ViewChild('historicoSort') set histSort(sort: MatSort) {
    if (sort) {
      this.historicoSort = sort;
      this.historicoDataSource.sort = sort;
    }
  }

  constructor(private reportesService: ReportesService) {
    this.setupFilterPredicate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['fechaInicio'] ||
      changes['fechaFin'] ||
      changes['idSucursal'] ||
      changes['idProducto']
    ) {
      this.cargarReporte();
    }
  }

  get displayedColumnsHistorico(): string[] {
    if (this.idSucursal === 0) {
      return ['fecha', 'sucursal_nombre', 'producto_nombre', 'producto_codigo', 'unidad_medida', 'cantidad_stock', 'momento'];
    } else {
      return ['fecha', 'producto_nombre', 'producto_codigo', 'unidad_medida', 'cantidad_stock', 'momento'];
    }
  }

  get displayedColumnsFiltersHistorico(): string[] {
    if (this.idSucursal === 0) {
      return ['filter-fecha', 'filter-sucursal_nombre', 'filter-producto_nombre', 'filter-producto_codigo', 'filter-unidad_medida', 'filter-cantidad_stock', 'filter-momento'];
    } else {
      return ['filter-fecha', 'filter-producto_nombre', 'filter-producto_codigo', 'filter-unidad_medida', 'filter-cantidad_stock', 'filter-momento'];
    }
  }

  cargarReporte(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      return;
    }

    this.loading = true;
    const filterSucursal = this.idSucursal !== 0 ? this.idSucursal : undefined;
    const prodFilter = this.idProducto !== 0 ? this.idProducto : undefined;

    this.reportesService.obtenerReporteHistoricoInventario(this.fechaInicio, this.fechaFin, filterSucursal, prodFilter).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response && response.success) {
          this.historicoData = response.data || [];
          this.historicoDataSource.data = this.historicoData;
        } else {
          this.historicoData = [];
          this.historicoDataSource.data = [];
          Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'No se pudieron obtener los datos.' });
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error al cargar reporte historico inventario:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error de Servidor',
          text: 'Ocurrió un error al cargar el histórico.'
        });
      }
    });
  }

  setupFilterPredicate(): void {
    this.historicoDataSource.filterPredicate = (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      
      const fechaMatch = !searchTerms.fecha || new Date(data.fecha).toLocaleString('es-MX').toLowerCase().includes(searchTerms.fecha.toLowerCase());
      const sucursalMatch = !searchTerms.sucursal_nombre || (data.sucursal_nombre || '').toLowerCase().includes(searchTerms.sucursal_nombre.toLowerCase());
      const productoMatch = !searchTerms.producto_nombre || (data.producto_nombre || '').toLowerCase().includes(searchTerms.producto_nombre.toLowerCase());
      const codigoMatch = !searchTerms.producto_codigo || (data.producto_codigo || '').toLowerCase().includes(searchTerms.producto_codigo.toLowerCase());
      const unidadMatch = !searchTerms.unidad_medida || (data.unidad_medida || '').toLowerCase().includes(searchTerms.unidad_medida.toLowerCase());
      const cantidadMatch = !searchTerms.cantidad_stock || (data.cantidad_stock || 0).toString().includes(searchTerms.cantidad_stock);
      const momentoMatch = !searchTerms.momento || (data.momento || '').toLowerCase().includes(searchTerms.momento.toLowerCase());

      return fechaMatch && sucursalMatch && productoMatch && codigoMatch && unidadMatch && cantidadMatch && momentoMatch;
    };
  }

  applyColumnFilterHistorico(column: string, value: string): void {
    this.filterValuesHistorico[column] = value.trim().toLowerCase();
    this.historicoDataSource.filter = JSON.stringify(this.filterValuesHistorico);
    if (this.historicoDataSource.paginator) {
      this.historicoDataSource.paginator.firstPage();
    }
  }

  imprimirReporte(): void {
    window.print();
  }
}
