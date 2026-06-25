import { Component, OnInit, Inject, PLATFORM_ID, ViewChild, OnDestroy } from '@angular/core';
import { ReportesService } from '../../services/reportes.service';
import { SucursalesService } from '../../services/sucursales.service';
import { ProductosService } from '../../services/productos.service';
import { ProveedoresService } from '../../services/proveedores.service';
import { ClientesService } from '../../services/clientes.service';
import { isPlatformBrowser } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit, OnDestroy {

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
  ventasDiaData: any[] = [];
  comprasData: any[] = [];
  maxHourlySales: number = 1;
  salesChart: any = null;
  sidebarCollapsed: boolean = false;

  // Inventario
  inventarioData: any[] = [];
  inventarioSummary: any = null;
  filtroEstatus: string = 'todos';
  searchTextInventario: string = '';
  
  // MatTable para Inventario
  inventarioDataSource = new MatTableDataSource<any>([]);
  totalItemsInventario = 0;
  filterValuesInventario: any = { producto: '', codigo: '', sucursal: '', inventariar: '', stock_minimo: '', cantidad: '', estado: '' };
  
  // MatTable para Historico Inventario
  historicoData: any[] = [];
  historicoDataSource = new MatTableDataSource<any>([]);
  filterValuesHistorico: any = { fecha: '', sucursal_nombre: '', producto_nombre: '', producto_codigo: '', unidad_medida: '', cantidad_stock: '', momento: '' };

  // MatTable para Ajustes Inventario
  ajustesData: any[] = [];
  ajustesDataSource = new MatTableDataSource<any>([]);
  filterValuesAjustes: any = { fecha: '', sucursal_nombre: '', usuario_nombre: '', producto_nombre: '', producto_codigo: '', unidad_medida: '', stock_anterior: '', stock_nuevo: '', stock_minimo_anterior: '', stock_minimo_nuevo: '', precio_anterior: '', precio_nuevo: '' };

  // ViewChild setters for dynamic conditional templates (*ngIf)
  private inventarioPaginator: MatPaginator | null = null;
  private inventarioSort: MatSort | null = null;

  @ViewChild('inventarioPaginator') set invPaginator(paginator: MatPaginator) {
    if (paginator) {
      this.inventarioPaginator = paginator;
      this.inventarioDataSource.paginator = paginator;
    }
  }

  @ViewChild('inventarioSort') set invSort(sort: MatSort) {
    if (sort) {
      this.inventarioSort = sort;
      this.inventarioDataSource.sort = sort;
    }
  }

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

  get displayedColumnsInventario(): string[] {
    if (this.idSucursalSelected === 0) {
      return ['producto', 'codigo', 'sucursal', 'inventariar', 'stock_minimo', 'cantidad', 'estado'];
    } else {
      return ['producto', 'codigo', 'inventariar', 'stock_minimo', 'cantidad', 'estado'];
    }
  }

  get displayedColumnsFiltersInventario(): string[] {
    if (this.idSucursalSelected === 0) {
      return ['filter-producto', 'filter-codigo', 'filter-sucursal', 'filter-inventariar', 'filter-stock_minimo', 'filter-cantidad', 'filter-estado'];
    } else {
      return ['filter-producto', 'filter-codigo', 'filter-inventariar', 'filter-stock_minimo', 'filter-cantidad', 'filter-estado'];
    }
  }

  get displayedColumnsHistorico(): string[] {
    if (this.idSucursalSelected === 0) {
      return ['fecha', 'sucursal_nombre', 'producto_nombre', 'producto_codigo', 'unidad_medida', 'cantidad_stock', 'momento'];
    } else {
      return ['fecha', 'producto_nombre', 'producto_codigo', 'unidad_medida', 'cantidad_stock', 'momento'];
    }
  }

  get displayedColumnsFiltersHistorico(): string[] {
    if (this.idSucursalSelected === 0) {
      return ['filter-fecha', 'filter-sucursal_nombre', 'filter-producto_nombre', 'filter-producto_codigo', 'filter-unidad_medida', 'filter-cantidad_stock', 'filter-momento'];
    } else {
      return ['filter-fecha', 'filter-producto_nombre', 'filter-producto_codigo', 'filter-unidad_medida', 'filter-cantidad_stock', 'filter-momento'];
    }
  }

  get displayedColumnsAjustes(): string[] {
    if (this.idSucursalSelected === 0) {
      return ['fecha', 'sucursal_nombre', 'usuario_nombre', 'producto_nombre', 'producto_codigo', 'unidad_medida', 'stock_anterior', 'stock_nuevo', 'stock_minimo_anterior', 'stock_minimo_nuevo', 'precio_anterior', 'precio_nuevo'];
    } else {
      return ['fecha', 'usuario_nombre', 'producto_nombre', 'producto_codigo', 'unidad_medida', 'stock_anterior', 'stock_nuevo', 'stock_minimo_anterior', 'stock_minimo_nuevo', 'precio_anterior', 'precio_nuevo'];
    }
  }

  get displayedColumnsFiltersAjustes(): string[] {
    if (this.idSucursalSelected === 0) {
      return ['filter-fecha', 'filter-sucursal_nombre', 'filter-usuario_nombre', 'filter-producto_nombre', 'filter-producto_codigo', 'filter-unidad_medida', 'filter-stock_anterior', 'filter-stock_nuevo', 'filter-stock_minimo_anterior', 'filter-stock_minimo_nuevo', 'filter-precio_anterior', 'filter-precio_nuevo'];
    } else {
      return ['filter-fecha', 'filter-usuario_nombre', 'filter-producto_nombre', 'filter-producto_codigo', 'filter-unidad_medida', 'filter-stock_anterior', 'filter-stock_nuevo', 'filter-stock_minimo_anterior', 'filter-stock_minimo_nuevo', 'filter-precio_anterior', 'filter-precio_nuevo'];
    }
  }
  
  // Nuevos Reportes Detallados y sus Listados
  productos: any[] = [];
  proveedores: any[] = [];
  clientes: any[] = [];
  
  comprasDetalladasData: any[] = [];
  ventasDetalladasData: any[] = [];

  // Filtros de Reportes Detallados
  idProductoSelected: number = 0;
  idProveedorSelected: number = 0;
  idClienteSelected: number = 0;

  // Totales Calculados del Reporte Actual
  totalComprasDetallado: number = 0;
  cantidadComprasDetallado: number = 0;
  totalVentasDetallado: number = 0;
  cantidadVentasDetallado: number = 0;
  
  loading: boolean = false;

  constructor(
    private reportesService: ReportesService,
    private sucursalesService: SucursalesService,
    private productosService: ProductosService,
    private proveedoresService: ProveedoresService,
    private clientesService: ClientesService,
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
    this.cargarProductos();
    this.cargarProveedores();
    this.cargarClientes();
    this.cargarReporte();
    this.setupFilterPredicate();
  }

  cargarProductos(): void {
    this.productosService.listarProductos().subscribe({
      next: (data: any) => {
        this.productos = data.data || data || [];
      },
      error: (err: any) => {
        console.error('Error al cargar productos:', err);
      }
    });
  }

  cargarProveedores(): void {
    this.proveedoresService.listarProveedores().subscribe({
      next: (data: any) => {
        this.proveedores = data.data || data || [];
      },
      error: (err: any) => {
        console.error('Error al cargar proveedores:', err);
      }
    });
  }

  cargarClientes(): void {
    this.clientesService.listarClientes().subscribe({
      next: (data: any) => {
        this.clientes = data.data || data || [];
      },
      error: (err: any) => {
        console.error('Error al cargar clientes:', err);
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

  calcularTotalesVentas(): void {
    this.totalVentasDetallado = 0;
    this.cantidadVentasDetallado = 0;
    this.ventasDetalladasData.forEach(item => {
      this.totalVentasDetallado += item.total_venta || 0;
      this.cantidadVentasDetallado += item.cantidad_vendida || 0;
    });
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
    if (this.activeTab !== 'inventario' && (!this.fechaInicio || !this.fechaFin)) {
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
    } else if (this.activeTab === 'ventas-analisis') {
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
    } else if (this.activeTab === 'compras-detallado') {
      const prodFilter = this.idProductoSelected ? this.idProductoSelected : undefined;
      const provFilter = this.idProveedorSelected ? this.idProveedorSelected : undefined;
      this.reportesService.obtenerReporteComprasDetallado(this.fechaInicio, this.fechaFin, filterSucursal, prodFilter, provFilter).subscribe({
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
        error: (err: any) => { this.loading = false; this.handleError(err); }
      });
    } else if (this.activeTab === 'ventas-detallado') {
      const prodFilter = this.idProductoSelected ? this.idProductoSelected : undefined;
      const clientFilter = this.idClienteSelected ? this.idClienteSelected : undefined;
      this.reportesService.obtenerReporteVentasDetallado(this.fechaInicio, this.fechaFin, filterSucursal, prodFilter, clientFilter).subscribe({
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
        error: (err: any) => { this.loading = false; this.handleError(err); }
      });
    } else if (this.activeTab === 'inventario') {
      this.reportesService.obtenerReporteInventario(filterSucursal).subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response && response.success) {
            this.inventarioData = response.data || [];
            this.inventarioSummary = response.summary || null;
            this.actualizarInventarioDataSource();
          } else {
            this.inventarioData = [];
            this.inventarioSummary = null;
            this.actualizarInventarioDataSource();
            Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'No se pudieron obtener los datos.' });
          }
        },
        error: (err: any) => { this.loading = false; this.handleError(err); }
      });
    } else if (this.activeTab === 'historico-inventario') {
      const prodFilter = this.idProductoSelected ? this.idProductoSelected : undefined;
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
        error: (err: any) => { this.loading = false; this.handleError(err); }
      });
    } else if (this.activeTab === 'ajustes-inventario') {
      const prodFilter = this.idProductoSelected ? this.idProductoSelected : undefined;
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
    this.idProductoSelected = 0;
    this.idProveedorSelected = 0;
    this.idClienteSelected = 0;
    this.cargarReporte();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    if (this.salesChart) {
      setTimeout(() => {
        this.salesChart.resize();
      }, 310);
    }
  }

  onFilterChange(): void {
    this.cargarReporte();
  }

  setupFilterPredicate(): void {
    this.inventarioDataSource.filterPredicate = (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      
      const productoMatch = !searchTerms.producto || (data.producto || '').toLowerCase().includes(searchTerms.producto.toLowerCase());
      const codigoMatch = !searchTerms.codigo || (data.codigo || '').toLowerCase().includes(searchTerms.codigo.toLowerCase());
      const sucursalMatch = !searchTerms.sucursal || (data.sucursal || '').toLowerCase().includes(searchTerms.sucursal.toLowerCase());
      
      let inventariableMatch = true;
      if (searchTerms.inventariar) {
        const val = searchTerms.inventariar.toLowerCase();
        const text = data.inventariar ? 'sí' : 'no';
        inventariableMatch = text.includes(val);
      }

      let stockMinimoMatch = true;
      if (searchTerms.stock_minimo) {
        if (!data.inventariar) {
          stockMinimoMatch = false;
        } else {
          stockMinimoMatch = (data.stock_minimo || 0).toString().includes(searchTerms.stock_minimo);
        }
      }

      let cantidadMatch = true;
      if (searchTerms.cantidad) {
        cantidadMatch = (data.cantidad || 0).toString().includes(searchTerms.cantidad);
      }
      
      let estadoMatch = true;
      if (searchTerms.estado) {
        const val = searchTerms.estado.toLowerCase();
        let estStr = 'saludable';
        if (data.inventariar && data.cantidad <= 0) estStr = 'agotado';
        else if (data.inventariar && data.cantidad > 0 && data.cantidad < data.stock_minimo) estStr = 'stock bajo';
        estadoMatch = estStr.includes(val);
      }

      return productoMatch && codigoMatch && sucursalMatch && inventariableMatch && stockMinimoMatch && cantidadMatch && estadoMatch;
    };

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

  applyColumnFilter(column: string, value: string): void {
    this.filterValuesInventario[column] = value.trim().toLowerCase();
    this.inventarioDataSource.filter = JSON.stringify(this.filterValuesInventario);
    if (this.inventarioDataSource.paginator) {
      this.inventarioDataSource.paginator.firstPage();
    }
  }

  applyColumnFilterHistorico(column: string, value: string): void {
    this.filterValuesHistorico[column] = value.trim().toLowerCase();
    this.historicoDataSource.filter = JSON.stringify(this.filterValuesHistorico);
    if (this.historicoDataSource.paginator) {
      this.historicoDataSource.paginator.firstPage();
    }
  }

  applyColumnFilterAjustes(column: string, value: string): void {
    this.filterValuesAjustes[column] = value.trim().toLowerCase();
    this.ajustesDataSource.filter = JSON.stringify(this.filterValuesAjustes);
    if (this.ajustesDataSource.paginator) {
      this.ajustesDataSource.paginator.firstPage();
    }
  }

  actualizarInventarioDataSource(): void {
    let result = this.inventarioData || [];

    if (this.filtroEstatus !== 'todos') {
      result = result.filter(item => {
        if (this.filtroEstatus === 'critico') {
          return item.inventariar && item.cantidad <= 0;
        } else if (this.filtroEstatus === 'bajo') {
          return item.inventariar && item.cantidad > 0 && item.cantidad < item.stock_minimo;
        } else if (this.filtroEstatus === 'ok') {
          return !item.inventariar || item.cantidad >= item.stock_minimo;
        }
        return true;
      });
    }

    if (this.searchTextInventario && this.searchTextInventario.trim()) {
      const text = this.searchTextInventario.toLowerCase().trim();
      result = result.filter(item => 
        (item.producto && item.producto.toLowerCase().includes(text)) ||
        (item.codigo && item.codigo.toLowerCase().includes(text)) ||
        (item.sucursal && item.sucursal.toLowerCase().includes(text))
      );
    }

    this.inventarioDataSource.data = result;
    this.totalItemsInventario = result.length;
  }

  cambiarFiltroEstatus(estatus: string): void {
    this.filtroEstatus = estatus;
    this.actualizarInventarioDataSource();
  }

  verRetiros(item: any) {
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

  imprimirReporte(): void {
    window.print();
  }

  ngOnDestroy(): void {
    if (this.salesChart) {
      this.salesChart.destroy();
    }
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
}
