import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import CryptoJS from 'crypto-js';
import Swal from 'sweetalert2';
import { ProductosService } from '../../../services/productos.service';
import { ClientesService } from '../../../services/clientes.service';
import { VentasService } from '../../../services/ventas.service';
import { PreciosService } from '../../../services/precios.service';
import { environment } from '../../../../environments/environment';
import { SucursalesService } from '../../../services/sucursales.service';
import { PrintService, TicketData } from '../../../services/print.service';

@Component({
  selector: 'app-nueva-venta',
  templateUrl: './nueva-venta.component.html',
  styleUrl: './nueva-venta.component.css'
})
export class NuevaVentaComponent implements OnInit {
  formVenta: FormGroup;
  idProducto: any = null;
  productos: any[] = [];
  clientes: any[] = [];
  idVentaEditando: number | null = null;
  folioEditando: string | null = null;
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['producto', 'codigo', 'cantidad', 'unidad_medida', 'precio', 'iva', 'subtotal', 'total', 'eliminar'];
  totalItems = 0;
  subtotal: number = 0;
  iva: number = 0;
  total: number = 0;
  idSucursal: any = 0;
  idCliente: any = null;
  precioProd: number = 0;
  manejaIva: boolean = false;
  metodoPago: string = 'efectivo';
  estatusVenta: number = 1; // 1=Completada, 2=Orden, 3=Crédito
  fechaVenta: string = '';
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

  constructor(
    private fb: FormBuilder,
    private productoService: ProductosService,
    private clientesService: ClientesService,
    private ventasService: VentasService,
    private preciosService: PreciosService,
    private router: Router,
    private sucursalesService: SucursalesService,
    private printService: PrintService,
    private route: ActivatedRoute
  ) {
    this.formVenta = this.fb.group({
      idCliente: [null, Validators.required]
    });
    this.idSucursal = localStorage.getItem('idSucursal');
    this.manejaIva = localStorage.getItem('manejaIva') === '1';

    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    this.fechaVenta = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
  }

  ngOnInit(): void {
    this.cargarConfiguracionSucursalLuegoProductos();
    this.listarClientes();

    this.route.queryParams.subscribe(params => {
      const editVentaId = params['editVentaId'];
      if (editVentaId) {
        this.idVentaEditando = parseInt(editVentaId);
        this.cargarOrdenParaEditar(this.idVentaEditando);
      }
    });
  }

  cargarConfiguracionSucursalLuegoProductos(): void {
    this.sucursalesService.getSucursalesByUsuario().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          const userSucursales = res.data || [];
          const activeId = localStorage.getItem('idSucursal');
          if (activeId) {
            const activeSuc = userSucursales.find((s: any) => s.idSucursal.toString() === activeId);
            if (activeSuc) {
              localStorage.setItem('sucursal', activeSuc.sucursal);
              localStorage.setItem('direccionSucursal', activeSuc.direccion || '');
              localStorage.setItem('manejaIva', (activeSuc.manejaIva ?? 0).toString());
              localStorage.setItem('imprimeTicket', (activeSuc.imprimeTicket ?? 1).toString());
              localStorage.setItem('bloqueoStock', activeSuc.bloqueoStock || 'estricto');
              
              this.manejaIva = activeSuc.manejaIva === 1 || activeSuc.manejaIva === true;
            }
          }
        }
        this.listarProductos();
      },
      error: (err) => {
        console.error('Error al sincronizar sucursal en nueva-venta:', err);
        this.listarProductos();
      }
    });
  }

  listarProductos(): void {
    this.productoService.listarProductos().subscribe({
      next: (data: any) => {
        const rawProducts = data.data || [];
        this.productos = rawProducts
          .filter((producto: any) => producto.se_vende === true || producto.se_vende === 1)
          .map((producto: any) => ({
            ...producto,
            iva: this.manejaIva ? 16 : 0,
            disabled: this.isDisabled(producto)
          }));
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  listarClientes(): void {
    this.clientesService.listarClientes().subscribe({
      next: (data: any) => {
        this.clientes = data || [];
        if (!this.idVentaEditando) {
          const defaultClient = this.clientes.find(c => c.nombre.toLowerCase().includes('público general') || c.nombre.toLowerCase().includes('general'));
          if (defaultClient) {
            this.idCliente = defaultClient.id;
          }
        }
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  cargarOrdenParaEditar(id: number): void {
    this.ventasService.obtenerDetalleVenta(id).subscribe({
      next: (res: any) => {
        if (res && res.success && res.data) {
          const venta = res.data;
          this.idCliente = venta.idCliente;
          this.estatusVenta = venta.estatus;
          this.metodoPago = venta.metodo_pago;
          this.folioEditando = venta.folio;
          if (venta.fecha) {
            this.fechaVenta = venta.fecha.replace(' ', 'T').substring(0, 16);
          }

          if (venta.productos && Array.isArray(venta.productos)) {
            this.dataSource.data = venta.productos.map((prod: any) => {
              const precio = parseFloat(prod.pivot.precio) || 0;
              const cantidad = parseInt(prod.pivot.cantidad) || 0;
              const subtotal = cantidad * precio;
              const ivaVal = this.manejaIva ? 16 : 0;
              const total = subtotal + (subtotal * (ivaVal / 100));

              return {
                id: prod.id,
                nombre: prod.nombre,
                codigo: prod.codigo,
                unidad_medida: prod.unidad_medida,
                cantidad: cantidad,
                precio: precio,
                subtotal: subtotal,
                total: total,
                iva: ivaVal
              };
            });
            this.dataSource.paginator = this.paginator;
            this.totalItems = this.dataSource.data.length;
            this.recalcularTodo();
          }
        }
      },
      error: (err) => {
        console.error('Error al cargar la orden de venta:', err);
        Swal.fire('Error', 'No se pudo cargar el detalle de la orden de venta.', 'error');
      }
    });
  }

  onProductoChange(): void {
    if (this.idProducto) {
      this.preciosService.obtenerPrecioBase(this.idProducto, this.idSucursal).subscribe({
        next: (data: any) => {
          this.precioProd = Number(data.precio_base) || 0;
        },
        error: (err) => {
          console.log('Error al obtener el precio base:', err);
          this.precioProd = 0;
        }
      });
    } else {
      this.precioProd = 0;
    }
  }

  customSearch(term: string, item: any) {
    term = term.toLowerCase();
    const codigoMatch = item.codigo && item.codigo.toLowerCase().includes(term);
    const nombreMatch = item.nombre.toLowerCase().includes(term);
    return nombreMatch || codigoMatch;
  }

  agregarProducto() {
    if (!this.idProducto) return;

    const productoExistente = this.dataSource.data.find(prod => prod.id == this.idProducto);
    if (productoExistente) {
      productoExistente.cantidad = (Number(productoExistente.cantidad) || 0) + 1;
      this.calcularTotales(productoExistente);
      this.idProducto = null;
      this.precioProd = 0;
      return;
    }

    const producto = this.productos.find((prod) => prod.id == this.idProducto);
    if (producto) {
      const precio = Number(this.precioProd) || 0;
      const prodObj = {
        ...producto,
        cantidad: 1,
        precio: precio,
        subtotal: precio,
        total: precio + (precio * (this.manejaIva ? 0.16 : 0)),
        iva: this.manejaIva ? 16 : 0
      };

      this.dataSource.data = [...this.dataSource.data, prodObj];
      this.dataSource.paginator = this.paginator;
      this.totalItems = this.dataSource.data.length;

      this.recalcularTodo();
      this.idProducto = null;
      this.precioProd = 0;
    }
  }

  eliminarProducto(index: number) {
    const currentData = [...this.dataSource.data];
    currentData.splice(index, 1);
    this.dataSource.data = currentData;
    this.totalItems = this.dataSource.data.length;
    this.recalcularTodo();
  }

  calcularTotales(producto: any) {
    const cantidad = Number(producto.cantidad) || 0;
    const precio = Number(producto.precio) || 0;
    const iva = Number(producto.iva) || 0;
    producto.subtotal = cantidad * precio;
    producto.total = producto.subtotal + (producto.subtotal * (iva / 100));
    this.recalcularTodo();
  }

  alCambiarMetodoPago(): void {
    if (this.metodoPago === 'credito') {
      this.estatusVenta = 3;
    } else {
      if (this.estatusVenta === 3) {
        this.estatusVenta = 1;
      }
    }
  }

  alCambiarEstatusVenta(): void {
    if (this.estatusVenta === 3) {
      this.metodoPago = 'credito';
    } else {
      if (this.metodoPago === 'credito') {
        this.metodoPago = 'efectivo';
      }
    }
  }

  recalcularTodo() {
    this.subtotal = 0;
    this.iva = 0;
    this.dataSource.data.forEach((prod: any) => {
      const subtotal = Number(prod.subtotal) || 0;
      const iva = Number(prod.iva) || 0;
      this.subtotal += subtotal;
      this.iva += subtotal * (iva / 100);
    });
    this.total = this.subtotal + this.iva;
  }

  guardarVenta() {
    if (!this.idCliente) {
      Swal.fire({
        icon: 'warning',
        title: 'Seleccione un cliente',
        text: 'Debe seleccionar un cliente antes de guardar.'
      });
      return;
    }
    if (this.dataSource.data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Venta vacía',
        text: 'Debe agregar al menos un producto a la venta.'
      });
      return;
    }

    // Validaciones para Crédito
    if (this.estatusVenta === 3 || this.metodoPago === 'credito') {
      const client = this.clientes.find(c => c.id == this.idCliente);
      if (!client || client.id === 1) { // 1 = Cliente General/Público General
        Swal.fire('Atención', 'Se requiere un cliente registrado para realizar una venta a crédito.', 'warning');
        return;
      }
      if (this.total > client.credito_disponible) {
        Swal.fire('Límite Excedido', `La venta de ${this.total} excede el crédito disponible del cliente (${client.credito_disponible}).`, 'error');
        return;
      }
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

    let idCaja = null;
    try {
      const encryptedCaja = localStorage.getItem('idCaja');
      if (encryptedCaja) {
        idCaja = CryptoJS.AES.decrypt(encryptedCaja, environment.secretKey).toString(CryptoJS.enc.Utf8);
      }
    } catch (e) {
      console.error('Error decrypting caja id', e);
    }

    const fechaCompleta = this.fechaVenta ? this.fechaVenta.replace('T', ' ') + ':00' : null;

    const dataVenta = {
      idUser: parseInt(idUsuario) || 1,
      idCliente: this.idCliente,
      subTotal: this.subtotal,
      total: this.total,
      iva: this.iva,
      idSucursal: parseInt(this.idSucursal) || 1,
      idCaja: idCaja ? parseInt(idCaja) : null,
      metodo_pago: this.metodoPago,
      estatus: this.estatusVenta,
      fecha: fechaCompleta,
      descuentos: 0,
      extras: 0,
      productos: this.dataSource.data.map(item => ({
        idProducto: item.id,
        cantidad: item.cantidad,
        precio: item.precio,
        promocion: '',
        total: item.total
      }))
    };

    const requestObservable = this.idVentaEditando
      ? this.ventasService.actualizarVenta(this.idVentaEditando, dataVenta)
      : this.ventasService.registrarVenta(dataVenta);

    requestObservable.subscribe({
      next: (res: any) => {
        const titleMsg = this.idVentaEditando ? 'Venta actualizada' : 'Venta registrada';
        const textMsg = this.idVentaEditando ? 'La venta se ha modificado correctamente.' : 'La venta se ha guardado correctamente.';
        Swal.fire({
          icon: 'success',
          title: titleMsg,
          text: textMsg,
          showConfirmButton: false,
          timer: 1500
        });

        this.router.navigate(['/panel/ventas']);
      },
      error: (err) => {
        console.error('Error al registrar venta:', err);
        const mensajeError = err.error?.message || 'Hubo un error al registrar la venta. Por favor, intente de nuevo.';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: mensajeError
        });
      }
    });
  }

  isDisabled(item: any): boolean {
    if (typeof window === 'undefined') return false;
    const bloqueo = localStorage.getItem('bloqueoStock') || 'estricto';

    if (bloqueo === 'desactivado') {
      return false;
    }

    if (bloqueo === 'directo') {
      if (item.inventariar && !item.tiene_componentes) {
        return (item.stock_disponible || 0) < 1;
      }
      return false;
    }

    // estricto
    if (item.inventariar || item.tiene_componentes) {
      return (item.stock_disponible || 0) < 1;
    }
    return false;
  }
}
