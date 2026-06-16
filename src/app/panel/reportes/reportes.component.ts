import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { ReportesService } from '../../services/reportes.service';
import { SucursalesService } from '../../services/sucursales.service';
import { ProductosService } from '../../services/productos.service';
import { ProveedoresService } from '../../services/proveedores.service';
import { ClientesService } from '../../services/clientes.service';
import { isPlatformBrowser } from '@angular/common';
import CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {

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
  comprasData: any[] = [];
  maxHourlySales: number = 1;

  // Inventario
  inventarioData: any[] = [];
  inventarioSummary: any = null;
  filtroEstatus: string = 'todos';
  searchTextInventario: string = '';
  
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
    } else if (this.activeTab === 'ventas-hora') {
      this.reportesService.obtenerReporteVentasHora(this.fechaInicio, this.fechaFin, filterSucursal).subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response && response.success) {
            this.horasData = response.data || [];
            this.maxHourlySales = Math.max(...this.horasData.map(h => h.pedidos), 1);
          } else {
            this.horasData = [];
            Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'No se pudieron obtener los datos.' });
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
          } else {
            this.inventarioData = [];
            this.inventarioSummary = null;
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

  onFilterChange(): void {
    this.cargarReporte();
  }

  get inventarioFiltrado(): any[] {
    let result = this.inventarioData || [];

    if (this.filtroEstatus !== 'todos') {
      result = result.filter(item => item.estatus === this.filtroEstatus);
    }

    if (this.searchTextInventario && this.searchTextInventario.trim()) {
      const text = this.searchTextInventario.toLowerCase().trim();
      result = result.filter(item => 
        (item.producto && item.producto.toLowerCase().includes(text)) ||
        (item.codigo && item.codigo.toLowerCase().includes(text)) ||
        (item.sucursal && item.sucursal.toLowerCase().includes(text))
      );
    }

    return result;
  }

  cambiarFiltroEstatus(estatus: string): void {
    this.filtroEstatus = estatus;
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
}
