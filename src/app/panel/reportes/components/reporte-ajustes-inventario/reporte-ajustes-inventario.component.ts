import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { ReportesService } from '../../../../services/reportes.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reporte-ajustes-inventario',
  templateUrl: './reporte-ajustes-inventario.component.html',
  styleUrls: []
})
export class ReporteAjustesInventarioComponent implements OnChanges {
  @Input() fechaInicio!: string;
  @Input() fechaFin!: string;
  @Input() idSucursal!: number;
  @Input() idProducto!: number;
  @Input() roleId!: number;

  loading = false;
  ajustesData: any[] = [];
  ajustesDataSource = new MatTableDataSource<any>([]);
  filterValuesAjustes: any = { fecha: '', sucursal_nombre: '', usuario_nombre: '', producto_nombre: '', producto_codigo: '', unidad_medida: '', stock_anterior: '', stock_nuevo: '', stock_minimo_anterior: '', stock_minimo_nuevo: '', precio_anterior: '', precio_nuevo: '' };

  private ajustesPaginator: MatPaginator | null = null;
  private ajustesSort: MatSort | null = null;

  @ViewChild('ajustesPaginator') set ajusPaginator(paginator: MatPaginator) {
    if (paginator) {
      this.ajustesPaginator = paginator;
      this.ajustesDataSource.paginator = paginator;
    }
  }

  @ViewChild('ajustesSort') set ajusSort(sort: MatSort) {
    if (sort) {
      this.ajustesSort = sort;
      this.ajustesDataSource.sort = sort;
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

  get displayedColumnsAjustes(): string[] {
    if (this.idSucursal === 0) {
      return ['fecha', 'sucursal_nombre', 'usuario_nombre', 'producto_nombre', 'producto_codigo', 'unidad_medida', 'stock_anterior', 'stock_nuevo', 'stock_minimo_anterior', 'stock_minimo_nuevo', 'precio_anterior', 'precio_nuevo'];
    } else {
      return ['fecha', 'usuario_nombre', 'producto_nombre', 'producto_codigo', 'unidad_medida', 'stock_anterior', 'stock_nuevo', 'stock_minimo_anterior', 'stock_minimo_nuevo', 'precio_anterior', 'precio_nuevo'];
    }
  }

  get displayedColumnsFiltersAjustes(): string[] {
    if (this.idSucursal === 0) {
      return ['filter-fecha', 'filter-sucursal_nombre', 'filter-usuario_nombre', 'filter-producto_nombre', 'filter-producto_codigo', 'filter-unidad_medida', 'filter-stock_anterior', 'filter-stock_nuevo', 'filter-stock_minimo_anterior', 'filter-stock_minimo_nuevo', 'filter-precio_anterior', 'filter-precio_nuevo'];
    } else {
      return ['filter-fecha', 'filter-usuario_nombre', 'filter-producto_nombre', 'filter-producto_codigo', 'filter-unidad_medida', 'filter-stock_anterior', 'filter-stock_nuevo', 'filter-stock_minimo_anterior', 'filter-stock_minimo_nuevo', 'filter-precio_anterior', 'filter-precio_nuevo'];
    }
  }

  cargarReporte(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      return;
    }

    this.loading = true;
    const filterSucursal = this.idSucursal !== 0 ? this.idSucursal : undefined;
    const prodFilter = this.idProducto !== 0 ? this.idProducto : undefined;

    this.reportesService.obtenerReporteAjustesInventario(this.fechaInicio, this.fechaFin, filterSucursal, prodFilter).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response && response.success) {
          this.ajustesData = response.data || [];
          this.ajustesDataSource.data = this.ajustesData;
        } else {
          this.ajustesData = [];
          this.ajustesDataSource.data = [];
          Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'No se pudieron obtener los datos.' });
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error al cargar reporte ajustes inventario:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error de Servidor',
          text: 'Ocurrió un error al cargar los ajustes.'
        });
      }
    });
  }

  setupFilterPredicate(): void {
    this.ajustesDataSource.filterPredicate = (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);

      const fechaMatch = !searchTerms.fecha || new Date(data.fecha).toLocaleString('es-MX').toLowerCase().includes(searchTerms.fecha.toLowerCase());
      const sucursalMatch = !searchTerms.sucursal_nombre || (data.sucursal_nombre || '').toLowerCase().includes(searchTerms.sucursal_nombre.toLowerCase());
      const usuarioMatch = !searchTerms.usuario_nombre || (data.usuario_nombre || '').toLowerCase().includes(searchTerms.usuario_nombre.toLowerCase());
      const productoMatch = !searchTerms.producto_nombre || (data.producto_nombre || '').toLowerCase().includes(searchTerms.producto_nombre.toLowerCase());
      const codigoMatch = !searchTerms.producto_codigo || (data.producto_codigo || '').toLowerCase().includes(searchTerms.producto_codigo.toLowerCase());
      const unidadMatch = !searchTerms.unidad_medida || (data.unidad_medida || '').toLowerCase().includes(searchTerms.unidad_medida.toLowerCase());
      const stockAnteriorMatch = !searchTerms.stock_anterior || (data.stock_anterior || 0).toString().includes(searchTerms.stock_anterior);
      const stockNuevoMatch = !searchTerms.stock_nuevo || (data.stock_nuevo || 0).toString().includes(searchTerms.stock_nuevo);
      const stockMinAnteriorMatch = !searchTerms.stock_minimo_anterior || (data.stock_minimo_anterior !== null ? data.stock_minimo_anterior : '').toString().includes(searchTerms.stock_minimo_anterior);
      const stockMinNuevoMatch = !searchTerms.stock_minimo_nuevo || (data.stock_minimo_nuevo !== null ? data.stock_minimo_nuevo : '').toString().includes(searchTerms.stock_minimo_nuevo);
      const precioAnteriorMatch = !searchTerms.precio_anterior || (data.precio_anterior !== null ? data.precio_anterior : '').toString().includes(searchTerms.precio_anterior);
      const precioNuevoMatch = !searchTerms.precio_nuevo || (data.precio_nuevo !== null ? data.precio_nuevo : '').toString().includes(searchTerms.precio_nuevo);

      return fechaMatch && sucursalMatch && usuarioMatch && productoMatch && codigoMatch && unidadMatch && stockAnteriorMatch && stockNuevoMatch && stockMinAnteriorMatch && stockMinNuevoMatch && precioAnteriorMatch && precioNuevoMatch;
    };
  }

  applyColumnFilterAjustes(column: string, value: string): void {
    this.filterValuesAjustes[column] = value.trim().toLowerCase();
    this.ajustesDataSource.filter = JSON.stringify(this.filterValuesAjustes);
    if (this.ajustesDataSource.paginator) {
      this.ajustesDataSource.paginator.firstPage();
    }
  }

  imprimirReporte(): void {
    window.print();
  }
}
