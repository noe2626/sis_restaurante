import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SucursalesService } from '../../../services/sucursales.service';
import { ComprasService } from '../../../services/compras.service';
import { ProductosService } from '../../../services/productos.service';
import Swal from 'sweetalert2';
import CryptoJS from 'crypto-js';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-compras',
  templateUrl: './compras.component.html',
  styleUrl: './compras.component.css'
})
export class ComprasComponent implements OnInit{
  data: Array<any> = [];
  idSucursal:any;
  sucursales: any = null;
  displayedColumns: string[] = ['folio', 'folio_proveedor', 'proveedor','fecha','total','estatus', 'detalle']; 
  displayedColumnsFilters: string[] = ['filter-folio', 'filter-folio_proveedor', 'filter-proveedor', 'filter-fecha', 'filter-total', 'filter-estatus', 'filter-space'];
  filterValues: any = { folio: '', folio_proveedor: '', proveedor: '', fecha: '', total: '', estatus: '' };
  dataSource = new MatTableDataSource<any>([]);
  totalItems = 0;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  @ViewChild(MatSort) sort: MatSort | null = null;
  
  originalData = [JSON.parse(JSON.stringify(this.data))]; // Copia profunda de los datos originales 
  
  filteredData = [...this.data];
  compraSeleccionada: any = null;

  // Variables para recibir orden
  compraParaRecibir: any = null;
  recibirEstatus: number = 1;
  recibirMetodoPago: string = 'efectivo';

  // Variables para abonos
  compraParaAbono: any = null;
  abonosLista: any[] = [];
  abonosCargando: boolean = false;
  totalAbonado: number = 0;
  saldoRestante: number = 0;
  nuevoAbonoMonto: number = 0;
  nuevoAbonoMetodo: string = 'efectivo';

  constructor(private sucursalesService: SucursalesService,
      private comprasService: ComprasService,
      private fb: FormBuilder,
    private productoService: ProductosService){
        
    }

    ngOnInit(): void {
    this.listarCompras();
    this.setupFilterPredicate();
  }

  setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      
      const folioMatch = !searchTerms.folio || (data.folio || '').toLowerCase().includes(searchTerms.folio.toLowerCase());
      const folioProvMatch = !searchTerms.folio_proveedor || (data.folio_proveedor || '').toLowerCase().includes(searchTerms.folio_proveedor.toLowerCase());
      const proveedorMatch = !searchTerms.proveedor || (data.proveedor || '').toLowerCase().includes(searchTerms.proveedor.toLowerCase());
      const fechaMatch = !searchTerms.fecha || (data.fecha || '').toLowerCase().includes(searchTerms.fecha.toLowerCase());
      const totalMatch = !searchTerms.total || (data.total || '').toString().includes(searchTerms.total);
      const estatusMatch = !searchTerms.estatus || (data.estatus || '').toLowerCase().includes(searchTerms.estatus.toLowerCase());

      return folioMatch && folioProvMatch && proveedorMatch && fechaMatch && totalMatch && estatusMatch;
    };
  }

  applyColumnFilter(column: string, value: string): void {
    this.filterValues[column] = value.trim().toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  listarCompras(): void {
    this.comprasService.listarCompras().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.data = res.data;
        } else if (Array.isArray(res)) {
          this.data = res;
        } else {
          this.data = [];
        }
        this.filteredData = [...this.data];
        this.dataSource.data = this.filteredData;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.totalItems = this.filteredData.length;
      },
      error: (err) => {
        console.error('Error al listar compras:', err);
        this.data = [];
        this.filteredData = [...this.data];
        this.dataSource.data = this.filteredData;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.totalItems = this.filteredData.length;
      }
    });
  }

    onSearch(event: Event): void {
      const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
      this.filteredData = this.data.filter(item => 
        item.proveedor && item.proveedor.toLowerCase().includes(searchTerm)
        || item.folio_proveedor && item.folio_proveedor.toLowerCase().includes(searchTerm)
        || item.folio && item.folio.toLowerCase().includes(searchTerm)
      );
      this.dataSource.data = this.filteredData;
      this.dataSource.paginator = this.paginator;
      this.totalItems = this.filteredData.length;
    }

    getEstatusClass(estatusId: number): string {
      switch (estatusId) {
        case 0: return 'bg-danger-subtle text-danger';
        case 1: return 'bg-success-subtle text-success';
        case 2: return 'bg-info-subtle text-info';
        case 3: return 'bg-warning-subtle text-warning-emphasis';
        case 4: return 'bg-success-subtle text-success'; // Crédito Liquidado
        default: return 'bg-secondary-subtle text-secondary';
      }
    }

    getEstatusIcon(estatusId: number): string {
      switch (estatusId) {
        case 0: return 'bi-x-circle-fill';
        case 1: return 'bi-check-circle-fill';
        case 2: return 'bi-hourglass-split';
        case 3: return 'bi-credit-card-2-front-fill';
        case 4: return 'bi-check-all';
        default: return 'bi-question-circle-fill';
      }
    }

    getEstatusText(estatusId: number): string {
      switch (estatusId) {
        case 0: return 'Cancelada';
        case 1: return 'Completada';
        case 2: return 'Orden de compra';
        case 3: return 'Crédito Pendiente';
        case 4: return 'Completada';
        default: return 'Desconocido';
      }
    }


    abrirModalRecibir(compra: any): void {
      this.compraParaRecibir = compra;
      this.recibirEstatus = 1;
      this.recibirMetodoPago = 'efectivo';
      
      const modalElement = document.getElementById('recibirOrdenModal');
      if (modalElement) {
        const bootstrap = (window as any).bootstrap;
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    }

    recibirOrden(): void {
      if (!this.compraParaRecibir) return;
      
      const payload = {
        estatus: parseInt(this.recibirEstatus as any),
        metodo_pago: this.recibirEstatus === 3 ? 'credito' : this.recibirMetodoPago
      };
      
      this.comprasService.recibirOrden(this.compraParaRecibir.id, payload).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            Swal.fire({
              icon: 'success',
              title: 'Orden Recibida',
              text: res.message || 'La orden de compra ha sido recibida correctamente.',
              showConfirmButton: false,
              timer: 1500
            });
            
            // Cerrar modal
            const closeBtn = document.getElementById('closeRecibirOrdenModalBtn');
            closeBtn?.click();
            
            // Recargar lista
            this.listarCompras();
          } else {
            Swal.fire('Error', res.message || 'No se pudo recibir la orden.', 'error');
          }
        },
        error: (err) => {
          console.error('Error al recibir orden:', err);
          Swal.fire('Error', err.error?.message || 'Error del servidor al recibir la orden.', 'error');
        }
      });
    }

    abrirModalAbonos(compra: any): void {
      this.compraParaAbono = compra;
      this.nuevoAbonoMonto = 0;
      this.nuevoAbonoMetodo = 'efectivo';
      this.abonosLista = [];
      this.totalAbonado = 0;
      this.saldoRestante = compra.total;
      
      this.cargarAbonos(compra.id);
      
      const modalElement = document.getElementById('abonosCompraModal');
      if (modalElement) {
        const bootstrap = (window as any).bootstrap;
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    }

    cargarAbonos(idCompra: number): void {
      this.abonosCargando = true;
      this.comprasService.listarAbonos(idCompra).subscribe({
        next: (res: any) => {
          this.abonosCargando = false;
          if (res && res.success) {
            this.abonosLista = res.data;
            this.totalAbonado = res.total_abonado;
            this.saldoRestante = res.saldo_restante;
          }
        },
        error: (err) => {
          this.abonosCargando = false;
          console.error('Error al cargar abonos:', err);
        }
      });
    }

    registrarAbono(): void {
      if (!this.compraParaAbono) return;
      if (this.nuevoAbonoMonto <= 0) {
        Swal.fire('Monto inválido', 'El monto del abono debe ser mayor a cero.', 'warning');
        return;
      }
      
      const abonoMonto = parseFloat(this.nuevoAbonoMonto.toFixed(2));
      const restante = parseFloat(this.saldoRestante.toFixed(2));

      if (abonoMonto > restante) {
        Swal.fire('Monto excedido', `El abono no puede superar el saldo restante (${restante}).`, 'warning');
        return;
      }

      let idUsuario = '1';
      try {
        const encryptedUser = localStorage.getItem('idUsuario');
        if (encryptedUser) {
          idUsuario = CryptoJS.AES.decrypt(encryptedUser, environment.secretKey).toString(CryptoJS.enc.Utf8);
        }
      } catch (e) {
        console.error('Error decrypting user id', e);
      }

      const payload = {
        idUser: parseInt(idUsuario) || 1,
        monto: abonoMonto,
        metodo_pago: this.nuevoAbonoMetodo
      };

      this.comprasService.registrarAbono(this.compraParaAbono.id, payload).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            Swal.fire({
              icon: 'success',
              title: 'Abono Registrado',
              text: 'El abono se ha guardado correctamente.',
              showConfirmButton: false,
              timer: 1500
            });
            
            // Limpiar input
            this.nuevoAbonoMonto = 0;
            this.nuevoAbonoMetodo = 'efectivo';
            
            // Recargar abonos
            this.cargarAbonos(this.compraParaAbono.id);
            
            // Recargar listado de compras principal
            this.listarCompras();
          } else {
            Swal.fire('Error', res.message || 'No se pudo registrar el abono.', 'error');
          }
        },
        error: (err) => {
          console.error('Error al registrar abonos:', err);
          Swal.fire('Error', err.error?.message || 'Error del servidor al registrar abono.', 'error');
        }
      });
    }

  verDetalle(id: number): void {
    this.comprasService.obtenerDetalleCompra(id).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          const compra = res.data;
          if (compra.abonos) {
            compra.totalAbonado = compra.abonos.reduce((sum: number, item: any) => sum + parseFloat(item.monto), 0);
            compra.saldoRestante = Math.max(0, compra.total - compra.totalAbonado);
          } else {
            compra.totalAbonado = 0;
            compra.saldoRestante = compra.total;
          }
          this.compraSeleccionada = compra;
          // Iniciar el modal usando bootstrap
          const modalElement = document.getElementById('detalleCompraModal');
          if (modalElement) {
            const bootstrap = (window as any).bootstrap;
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
          }
        } else {
          Swal.fire('Error', 'No se pudo obtener el detalle de la compra.', 'error');
        }
      },
      error: (err) => {
        console.error('Error al obtener el detalle de la compra:', err);
        Swal.fire('Error', 'Hubo un error al comunicarse con el servidor.', 'error');
      }
    });
  }

  cancelarCompra(id: number): void {
    Swal.fire({
      title: '¿Está seguro de cancelar esta compra?',
      text: 'Esta acción restará el inventario de todos los productos ingresados en esta compra.',
      input: 'text',
      inputPlaceholder: 'Escriba el motivo de la cancelación...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cancelar compra',
      cancelButtonText: 'No, conservar',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Debe ingresar un motivo para poder cancelar la compra.';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const motivo = result.value;
        this.comprasService.cancelarCompra(id, motivo).subscribe({
          next: (res: any) => {
            if (res && res.success) {
              Swal.fire({
                icon: 'success',
                title: 'Compra Cancelada',
                text: 'La compra ha sido cancelada e inventarios revertidos con éxito.',
                showConfirmButton: false,
                timer: 1500
              });
              // Cerrar modal de detalle si estaba abierto
              const closeBtn = document.getElementById('closeDetalleCompraModalBtn');
              closeBtn?.click();
              // Recargar listado
              this.listarCompras();
            } else {
              Swal.fire('Error', res.message || 'No se pudo cancelar la compra.', 'error');
            }
          },
          error: (err) => {
            console.error('Error al cancelar la compra:', err);
            const errMsg = err.error?.message || 'Hubo un error del servidor.';
            Swal.fire('Error', errMsg, 'error');
          }
        });
      }
    });
  }
}
