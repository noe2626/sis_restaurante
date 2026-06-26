import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { SucursalesService } from '../../services/sucursales.service';
import { ProductosService } from '../../services/productos.service';
import { ProveedoresService } from '../../services/proveedores.service';
import { ClientesService } from '../../services/clientes.service';
import { isPlatformBrowser } from '@angular/common';
import CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';

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
  
  // Navegación
  activeTab: string = 'general';
  sidebarCollapsed: boolean = false;
  
  // Listas de Catálogos (Filtros)
  productos: any[] = [];
  proveedores: any[] = [];
  clientes: any[] = [];
  
  // Filtros Seleccionados
  idProductoSelected: number = 0;
  idProveedorSelected: number = 0;
  idClienteSelected: number = 0;
  tipoPagoSelected: string = 'todos';

  constructor(
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

  cambiarTab(tabName: string): void {
    this.activeTab = tabName;
    this.idProductoSelected = 0;
    this.idProveedorSelected = 0;
    this.idClienteSelected = 0;
    this.tipoPagoSelected = 'todos';
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onFilterChange(): void {
    // Al ser inputs vinculados por ngModel, el cambio se propagará a los componentes hijos automáticamente
  }

  getSucursalName(): string {
    if (this.idSucursalSelected === 0) {
      return 'Todas las Sucursales';
    }
    const suc = this.sucursales.find(s => (s.idSucursal || s.id) === this.idSucursalSelected);
    return suc ? (suc.sucursal || suc.nombre) : 'Todas las Sucursales';
  }

  getProductoName(): string {
    if (this.idProductoSelected === 0) {
      return 'Todos los Productos';
    }
    const prod = this.productos.find(p => p.id === this.idProductoSelected);
    return prod ? prod.nombre : 'Todos los Productos';
  }

  getProveedorName(): string {
    if (this.idProveedorSelected === 0) {
      return 'Todos los Proveedores';
    }
    const prov = this.proveedores.find(p => p.id === this.idProveedorSelected);
    return prov ? prov.nombre : 'Todos los Proveedores';
  }

  getClientName(): string {
    if (this.idClienteSelected === 0) {
      return 'Todos los Clientes';
    }
    const cli = this.clientes.find(c => c.id === this.idClienteSelected);
    return cli ? cli.nombre : 'Todos los Clientes';
  }

  getFriendlyTabName(): string {
    switch (this.activeTab) {
      case 'general': return 'Reporte de Resumen General';
      case 'cajas': return 'Reporte de Auditoría de Cajas (Arqueos)';
      case 'ventas-analisis': return 'Reporte de Análisis de Ventas Diarias';
      case 'compras-detallado': return 'Reporte Detallado de Compras';
      case 'ventas-detallado': return 'Reporte Detallado de Ventas';
      case 'inventario': return 'Reporte de Inventario Actual';
      case 'historico-inventario': return 'Historial de Existencias Diarias';
      case 'ajustes-inventario': return 'Bitácora de Ajustes Manuales de Inventario';
      default: return 'Reporte del Sistema';
    }
  }

  get fechaHoy(): Date {
    return new Date();
  }

  imprimirReporte(): void {
    window.print();
  }
}
