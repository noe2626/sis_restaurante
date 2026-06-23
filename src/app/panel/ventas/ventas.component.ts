import { AfterViewInit, Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { switchMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductosService } from '../../services/productos.service';
import { VentasService } from '../../services/ventas.service';
import { ClientesService } from '../../services/clientes.service';
import { PreciosService } from '../../services/precios.service';
import { AuthService } from '../../services/auth.service';
import { CanalesVentaService } from '../../services/canales-venta.service';
import Swal from 'sweetalert2';
import { SucursalesService } from '../../services/sucursales.service';
declare var bootstrap: any;
import CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';
import { PrintService, TicketData } from '../../services/print.service';
import { CajasService } from '../../services/cajas.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-ventas',
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.css']
})
export class VentasComponent implements OnInit{
  productos: any[] = [];
  clientes: any[] = [];
  carrito: any[] = [];
  idCliente: any = null; // Cliente opcional
  formProd: FormGroup;
  precioProd: number = 0;
  total: number = 0;
  subTotal: number = 0;
  iva: number = 0;
  extras: number = 0;
  descuentos: number = 0;
  canalesVenta: any[] = [];
  idCanalVenta: any = null;
  typeaheadInput$ = new Subject<string>();
  pago:any = 0;
  cambio:number = 0;
  metodoPago: string = 'efectivo';
  idSucursal:any = 0;
  productosRapidos: any[] = [];
  manejaIva: boolean = false;
  imprimeTicket: boolean = true;
  activeTabMovil: 'cliente' | 'productos' | 'carrito' = 'cliente';
  colores = [
    'rgba(76, 175, 80, 0.25)',   // Verde
    'rgba(33, 150, 243, 0.25)',  // Azul
    'rgba(255, 152, 0, 0.25)',   // Naranja
    'rgba(156, 39, 176, 0.25)',  // Morado
    'rgba(0, 150, 136, 0.25)',   // Turquesa
    'rgba(233, 30, 99, 0.25)',   // Rosa
    'rgba(121, 85, 72, 0.25)',   // Café
    'rgba(96, 125, 139, 0.25)'   // Gris azulado
  ];

  estatusVenta: number = 1; // 1=Completada, 2=Orden, 3=Crédito
  estatusVentaPredeterminado: number = 1; // Para cargar el estatus predeterminado desde la caja
  abonosModalVentas: any[] = [];
  ventaSeleccionadaAbono: any = null;
  montoAbonoInput: number = 0;
  metodoPagoAbono: string = 'efectivo';

  // Pedidos Pendientes en POS
  ordenesPendientes: any[] = [];
  ordenACobrar: any = null;
  estatusEntregaPos: number = 1;
  metodoPagoEntregaPos: string = 'efectivo';
  clienteSeleccionado: any = null;
  ordenSeleccionadaDetalle: number | null = null;
  productosDeOrdenSeleccionada: any[] = [];
  cargandoDetalleOrden: boolean = false;

  // Edición de Órdenes de Venta
  idVentaEditando: number | null = null;
  folioEditando: string | null = null;

  constructor(
    private fb: FormBuilder,
    private productoService: ProductosService,
    private ventasService: VentasService,
    private clientesService: ClientesService,
    private preciosService: PreciosService,
    private authService: AuthService,
    private canalesVentaService: CanalesVentaService,
    private renderer: Renderer2,
    private sucursalesService: SucursalesService,
    private printService: PrintService,
    private cajasService: CajasService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.formProd = this.fb.group({
      idProducto: [null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });
    this.idSucursal=localStorage.getItem('idSucursal');
    this.manejaIva = localStorage.getItem('manejaIva') === '1';
    this.imprimeTicket = localStorage.getItem('imprimeTicket') !== '0';
  }



  ngOnInit(): void {
    this.cargarConfiguracionSucursalLuegoProductos();
    this.listarClientes();
    this.listarCanalesVenta();
    this.cargarEstatusPredeterminadoCaja();
    this.cargarPedidosPendientes();

    this.route.queryParams.subscribe(params => {
      const editVentaId = params['editVentaId'];
      if (editVentaId) {
        this.ventasService.obtenerDetalleVenta(parseInt(editVentaId)).subscribe({
          next: (res: any) => {
            if (res && res.success && res.data) {
              this.cargarOrdenParaEditar(res.data);
            }
          },
          error: (err) => {
            console.error('Error al cargar la orden de venta:', err);
            Swal.fire('Error', 'No se pudo cargar la orden de venta seleccionada.', 'error');
          }
        });
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
              this.imprimeTicket = activeSuc.imprimeTicket !== 0 && activeSuc.imprimeTicket !== false;
            }
          }
        }
        this.listarProductos();
        this.listarProductosMasVendidos();
      },
      error: (err) => {
        console.error('Error al sincronizar sucursal en POS:', err);
        this.listarProductos();
        this.listarProductosMasVendidos();
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
            disabled: this.isDisabled(producto) 
          }));
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  listarProductosMasVendidos(): void {
    this.productoService.listarProductosMasVendidos().subscribe({
      next: (data: any) => {
        const rawProducts = data.data || [];
        this.productosRapidos = rawProducts
          .filter((producto: any) => producto.se_vende === true || producto.se_vende === 1)
          .map((producto: any) => ({ 
            ...producto, 
            disabled: this.isDisabled(producto) 
          }));
          this.productosRapidos = this.productosRapidos.slice(0, 8); // Limitar a los 8 más vendidos
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  customSearch(term: string, item: any) {
    term = term.toLowerCase(); // Convertir el término a minúsculas para una búsqueda insensible a mayúsculas.
    
    // Verificamos si el código existe y si contiene el término, de lo contrario, solo buscamos en el nombre.
    const codigoMatch = item.codigo && item.codigo.toLowerCase().includes(term);
    const nombreMatch = item.nombre.toLowerCase().includes(term);
    
    // Si coincide con el nombre o con el código, devolver true
    return nombreMatch || codigoMatch;
  }

  listarClientes(): void {
    this.clientesService.listarClientes().subscribe({
      next: (data: any) => {
        this.clientes = data.data || data || [];
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  listarCanalesVenta(): void {
    this.canalesVentaService.listarCanalesVenta(this.idSucursal).subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.canalesVenta = data.filter((c: any) => c.activo === 1 || c.activo === true);
          // Auto seleccionar "Comedor" (id = 1) por defecto si existe
          const comedor = this.canalesVenta.find((c: any) => c.id === 1);
          if (comedor) {
            this.idCanalVenta = comedor.id;
          }
        }
      },
      error: (err) => {
        console.log('Error al listar canales de venta:', err);
      }
    });
  }

  onProductoChange(): void {
    const idProducto = this.formProd.get('idProducto')?.value;
    if (idProducto) {
      this.preciosService.obtenerPrecioBase(idProducto, this.idSucursal).subscribe({
        next: (data: any) => {
          this.precioProd = data.precio_base;
        },
        error: (err) => {
          console.log('Error al obtener el precio base:', err);
        }
      });
    } else {
      this.precioProd = 0;
    }
  }

  agregarProducto(): void {
    const idProducto = this.formProd.get('idProducto')?.value;
    const cantidad = this.formProd.get('cantidad')?.value;
    const producto = this.productos.find(p => p.id == idProducto);
    if (producto) {
      const item = { 
        ...producto, 
        cantidad, 
        precio: this.precioProd, 
        precio_base: this.precioProd, 
        subtotal: this.precioProd * cantidad, 
        promocion: '' 
      };

      // Obtener el precio final y promoción al agregar el producto
      this.preciosService.obtenerPrecioFinal(idProducto, this.idSucursal, this.idCliente, cantidad).subscribe({
        next: (data: any) => {
          if (data && data.success !== false) {
            item.precio = data.precio_final;
            if (data.aplica_promocion) {
              item.promocion = data.promocion_descripcion;
            } else {
              item.promocion = '';
            }
          }
          item.subtotal = item.cantidad * item.precio;
          this.carrito.unshift(item);
          this.calcularTotal();
          
          this.validarPromocionDinamica(item);
          
          this.formProd.reset({ idProducto: null, cantidad: 1 });
          this.precioProd = 0;
        },
        error: (err) => {
          console.log('Error al obtener el precio final:', err);
        }
      });
    }
  }

  actualizarSubtotal(item: any): void {
    this.preciosService.obtenerPrecioFinal(item.id, this.idSucursal, this.idCliente, item.cantidad).subscribe({
      next: (data: any) => {
        if (data && data.success !== false) {
          item.precio = data.precio_final;
          if (data.aplica_promocion) {
            item.promocion = data.promocion_descripcion;
          } else {
            item.promocion = '';
          }
        } else {
          item.precio = item.precio_base || item.precio;
          item.promocion = '';
        }
        item.subtotal = item.cantidad * item.precio;
        this.calcularTotal();
        this.validarPromocionDinamica(item);
      },
      error: (err) => {
        console.error('Error al actualizar el precio final:', err);
        item.subtotal = item.cantidad * item.precio;
        this.calcularTotal();
        this.validarPromocionDinamica(item);
      }
    });
  }

  validarPromocionDinamica(item: any): void {
    this.preciosService.validarPromocionDinamica(item.id, this.idSucursal, item.cantidad).subscribe({
      next: (data: any) => {
        if (data.aplica_promocion) {
          item.subtotal = data.total;
          item.promocion = data.promocion_descripcion;
        }
        this.calcularTotal();
      },
      error: (err) => {
        console.log('Error al validar la promoción dinámica:', err);
      }
    });
  }

  calcularTotal(): void {
    this.subTotal = this.carrito.reduce((sum, item) => sum + item.subtotal, 0);
    
    // Calcular extras (cargos de envío) si hay un canal seleccionado
    if (this.idCanalVenta) {
      const canal = this.canalesVenta.find(c => c.id === this.idCanalVenta);
      if (canal && parseFloat(canal.cargo_cliente) > 0) {
        const minimoEnvioGratis = parseFloat(canal.minimo_envio_gratis);
        if (minimoEnvioGratis > 0 && this.subTotal >= minimoEnvioGratis) {
          this.extras = 0;
        } else {
          this.extras = parseFloat(canal.cargo_cliente);
        }
      } else {
        this.extras = 0;
      }
    } else {
      this.extras = 0;
    }

    const descuentos = this.descuentos;
    const extras = this.extras;
    if (this.manejaIva) {
      this.iva = (this.subTotal + extras - descuentos) * 0.16;
      this.total = (this.subTotal + extras - descuentos) + this.iva;
    } else {
      this.iva = 0;
      this.total = (this.subTotal + extras - descuentos);
    }
  }

  eliminarProducto(index: number): void {
    this.carrito.splice(index, 1);
    this.calcularTotal();
  }

  ventaDirectaSeleccionada = false;

  pagar(){
    this.pago = null;
    this.ventaDirectaSeleccionada = false;
    if (this.estatusVenta === 2) {
      this.metodoPago = 'efectivo';
      this.pago = 0;
    } else if (this.estatusVenta === 3) {
      this.metodoPago = 'credito';
      this.pago = this.total;
    } else {
      this.metodoPago = 'efectivo';
      this.pago = null;
    }
  }

  seleccionarVentaDirecta(): void {
    this.ventaDirectaSeleccionada = true;
    this.estatusVenta = 1;
    this.metodoPago = 'efectivo';
    this.pago = null;
    setTimeout(() => {
      var pagoInput = document.getElementById("pagoInput");
      pagoInput?.focus();
    }, 300);
  }

  seleccionarOrdenVenta(): void {
    this.estatusVenta = 2;
    this.metodoPago = 'efectivo';
    this.pago = 0;
    this.registrarVenta();
  }

  seleccionarVentaCredito(): void {
    this.estatusVenta = 3;
    this.metodoPago = 'credito';
    this.pago = this.total;
    this.registrarVenta();
  }

  alCambiarMetodoPago(): void {
    if (this.metodoPago === 'credito') {
      this.estatusVenta = 3;
      this.pago = this.total;
    } else {
      if (this.estatusVenta === 3) {
        this.estatusVenta = 1;
      }
      if (this.metodoPago !== 'efectivo') {
        this.pago = this.total;
      } else {
        this.pago = null;
        setTimeout(() => {
          document.getElementById("pagoInput")?.focus();
        }, 100);
      }
    }
  }

  alCambiarEstatusVenta(): void {
    if (this.estatusVenta === 3) {
      this.metodoPago = 'credito';
      this.pago = this.total;
    } else if (this.estatusVenta === 2) {
      this.metodoPago = 'efectivo';
      this.pago = 0;
    } else {
      if (this.metodoPago === 'credito') {
        this.metodoPago = 'efectivo';
        this.pago = null;
      }
    }
  }

  cargarEstatusPredeterminadoCaja(): void {
    try {
      const encryptedCaja = localStorage.getItem('idCaja');
      if (encryptedCaja) {
        const decryptedIdCaja = CryptoJS.AES.decrypt(encryptedCaja, environment.secretKey).toString(CryptoJS.enc.Utf8);
        if (decryptedIdCaja) {
          this.cajasService.verificarCajas(parseInt(decryptedIdCaja)).subscribe({
            next: (res: any) => {
              if (res && res.success && res.data) {
                this.estatusVenta = res.data.estatus_predeterminado || 1;
                this.estatusVentaPredeterminado = this.estatusVenta;
                if (this.estatusVenta === 3) {
                  this.metodoPago = 'credito';
                  this.pago = this.total;
                }
              }
            },
            error: (err) => {
              console.error('Error al verificar caja:', err);
            }
          });
        }
      }
    } catch (e) {
      console.error('Error al desencriptar idCaja:', e);
    }
  }

  getClienteSeleccionado() {
    this.clienteSeleccionado = null;
    this.clientesService.informacionCliente(this.idCliente).subscribe({
      next: (res: any) => {
        
        if (res && res.success) {
          this.clienteSeleccionado = res.cliente || null;
          this.calcularTotal();
        }
      },
      error: (err) => {
        console.error('Error al consultar cliente:', err);
      }
    });
  }

  cargarOrdenParaEditar(venta: any): void {
    if (!venta) return;
    this.carrito = [];
    this.idCliente = venta.idCliente;
    this.getClienteSeleccionado();
    this.idCanalVenta = venta.idCanalVenta;
    
    if (venta.productos && Array.isArray(venta.productos)) {
      venta.productos.forEach((prod: any) => {
        this.carrito.push({
          id: prod.id,
          nombre: prod.nombre,
          precio: parseFloat(prod.pivot.precio),
          cantidad: parseInt(prod.pivot.cantidad),
          subtotal: parseFloat(prod.pivot.total),
          promocion: prod.pivot.promocion || null,
          unidad_medida: prod.unidad_medida
        });
      });
    }

    this.descuentos = parseFloat(venta.descuentos) || 0;
    this.extras = parseFloat(venta.extras) || 0;
    this.iva = parseFloat(venta.iva) || 0;
    this.subTotal = parseFloat(venta.subtotal) || 0;
    this.total = parseFloat(venta.total) || 0;
    
    this.idVentaEditando = venta.id;
    this.folioEditando = venta.folio;
    this.estatusVenta = venta.estatus;
  }

  iniciarEdicionOrden(id: number): void {
    this.ventasService.obtenerDetalleVenta(id).subscribe({
      next: (res: any) => {
        if (res && res.success && res.data) {
          this.cargarOrdenParaEditar(res.data);
          const modalElement = document.getElementById('pedidosPendientesModal');
          if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal?.hide();
          }
        }
      },
      error: (err) => {
        console.error('Error al obtener detalle de orden para edición:', err);
        Swal.fire('Error', 'No se pudieron obtener los detalles del pedido.', 'error');
      }
    });
  }

  abrirModalAbonosPos(): void {
    if (!this.idCliente || this.idCliente === 1) return;
    this.clientesService.listarCuentasPendientes(this.idCliente).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.abonosModalVentas = res.data || [];
          this.ventaSeleccionadaAbono = null;
          this.montoAbonoInput = 0;
          this.metodoPagoAbono = 'efectivo';
          
          const modalElement = document.getElementById('abonosPosModal');
          if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
          }
        }
      },
      error: (err) => {
        console.error('Error al cargar cuentas pendientes:', err);
        Swal.fire('Error', 'No se pudieron cargar las cuentas pendientes del cliente.', 'error');
      }
    });
  }

  onSelectVentaAbono(venta: any): void {
    this.ventaSeleccionadaAbono = venta;
    this.montoAbonoInput = venta.saldo_restante;
  }

  registrarAbonoPos(): void {
    if (!this.ventaSeleccionadaAbono) {
      Swal.fire('Atención', 'Por favor, seleccione una venta a abonar.', 'warning');
      return;
    }
    if (this.montoAbonoInput <= 0) {
      Swal.fire('Atención', 'El monto a abonar debe ser mayor a 0.', 'warning');
      return;
    }
    if (this.montoAbonoInput > this.ventaSeleccionadaAbono.saldo_restante) {
      Swal.fire('Atención', 'El monto no puede superar el saldo restante.', 'warning');
      return;
    }

    let idUsuario = CryptoJS.AES.decrypt(localStorage.getItem('idUsuario') || '', environment.secretKey).toString(CryptoJS.enc.Utf8);
    const decryptedIdCaja = CryptoJS.AES.decrypt(localStorage.getItem('idCaja') || '', environment.secretKey).toString(CryptoJS.enc.Utf8);

    const payload = {
      monto: this.montoAbonoInput,
      metodo_pago: this.metodoPagoAbono,
      idUser: parseInt(idUsuario),
      idCaja: decryptedIdCaja ? parseInt(decryptedIdCaja) : null
    };

    this.ventasService.registrarAbono(this.ventaSeleccionadaAbono.id, payload).subscribe({
      next: (res: any) => {
        Swal.fire('Éxito', 'Abono registrado correctamente.', 'success');
        const modalElement = document.getElementById('abonosPosModal');
        if (modalElement) {
          const modal = bootstrap.Modal.getInstance(modalElement);
          modal?.hide();
        }
        this.listarClientes();
        this.getClienteSeleccionado();
        this.ventaSeleccionadaAbono = null;
        this.montoAbonoInput = 0;
      },
      error: (err) => {
        console.error('Error al registrar abono:', err);
        Swal.fire('Error', err.error?.message || 'Error al registrar el abono.', 'error');
      }
    });
  }

  registrarVenta(): void {
    // Validaciones para Crédito
    if (this.estatusVenta === 3 || this.metodoPago === 'credito') {
      if (!this.idCliente || this.idCliente === 1) {
        Swal.fire('Atención', 'Se requiere un cliente registrado para realizar una venta a crédito.', 'warning');
        return;
      }
      const clienteObj = this.clienteSeleccionado;
      if (clienteObj && this.total > clienteObj.credito_disponible) {
        Swal.fire('Límite Excedido', `La venta de ${this.total} excede el crédito disponible del cliente (${clienteObj.credito_disponible}).`, 'error');
        return;
      }
    }

    const decryptedIdCaja = CryptoJS.AES.decrypt(localStorage.getItem('idCaja'), environment.secretKey).toString(CryptoJS.enc.Utf8);
    let idUsuario = CryptoJS.AES.decrypt(localStorage.getItem('idUsuario'), environment.secretKey).toString(CryptoJS.enc.Utf8);
    const venta = {
      idUser: parseInt(idUsuario),
      idCliente: this.idCliente,
      total: this.total,
      descuentos: this.descuentos,
      extras: this.extras,
      iva: this.iva,
      subTotal: this.subTotal,
      idSucursal: this.idSucursal,
      idCaja: decryptedIdCaja,
      metodo_pago: this.metodoPago,
      idCanalVenta: this.idCanalVenta,
      estatus: this.estatusVenta,
      productos: this.carrito.map(item => ({
        idProducto: item.id,
        cantidad: item.cantidad,
        precio: item.precio,
        promocion: item.promocion,
        total: item.subtotal
      }))
    };
    const requestObservable = this.idVentaEditando
      ? this.ventasService.actualizarVenta(this.idVentaEditando, venta)
      : this.ventasService.registrarVenta(venta);

    requestObservable.subscribe({
      next: (data: any) => {
        const titleMsg = this.idVentaEditando ? "Venta actualizada correctamente" : "Venta registrada correctamente";
        Swal.fire({
          icon: "success",
          title: titleMsg,
          showConfirmButton: false,
          timer: 1500
        });
        this.cambio = (this.pago || this.total) - this.total;
        
        try {
          const printData: TicketData = {
            folio: data.venta.folio,
            fecha: data.venta.fecha,
            cliente: this.clientes.find(c => c.id == this.idCliente)?.nombre || 'Cliente General',
            cajero: localStorage.getItem('userName') || 'N/A',
            canal: this.canalesVenta.find(c => c.id == this.idCanalVenta)?.nombre || 'Comedor',
            metodo_pago: this.metodoPago,
            subtotal: this.subTotal,
            descuentos: this.descuentos,
            extras: this.extras,
            iva: this.iva,
            total: this.total,
            pago: this.pago || this.total,
            cambio: this.cambio,
            productos: this.carrito.map(item => ({
              nombre: item.nombre,
              cantidad: item.cantidad,
              precio: item.precio,
              total: item.subtotal,
              promocion: item.promocion
            }))
          };

          // 1. Siempre imprimir comanda
          this.printService.imprimirComanda(printData);

          // 2. Imprimir ticket de venta solo si es Completada (1) o Crédito (3)
          if (this.imprimeTicket && (this.estatusVenta === 1 || this.estatusVenta === 3)) {
            setTimeout(() => {
              this.printService.imprimirTicket(printData);
            }, 1000);

            // Si es una venta por canal externo (idCanalVenta != 1), imprimir el segundo ticket de canal
            if (this.idCanalVenta && this.idCanalVenta != 1) {
              const canalObj = this.canalesVenta.find(c => c.id == this.idCanalVenta);
              const canalPrintData: TicketData = {
                ...printData,
                canal_costo_tercero: data.venta.canal_costo_tercero || 0,
                canal_cargo_cliente: data.venta.canal_cargo_cliente || 0,
                descuenta_caja: canalObj ? (canalObj.descuenta_caja == 1 || canalObj.descuenta_caja === true) : false
              };
              setTimeout(() => {
                this.printService.imprimirTicketCanal(canalPrintData);
              }, 2000);
            }
          }
        } catch (printErr) {
          console.error('Error al imprimir comanda/ticket:', printErr);
        }
        this.estatusVenta = this.estatusVentaPredeterminado;
        document.getElementById('btnFinalizar')?.click();
      },
      error: (err) => {
        console.log('Error al registrar la venta:', err);
        const mensajeError = err.error?.message || 'Hubo un error al registrar la venta. Por favor, intente de nuevo.';
        Swal.fire({
          icon: 'error',
          title: 'Error al registrar venta',
          text: mensajeError
        });
      }
    });
  }

  finalizarVenta(){
    this.resetearFormulario();
    this.total = 0;
    this.subTotal = 0;
    this.cambio = 0;
    this.iva = 0;
    this.pago = 0;
    this.metodoPago = 'efectivo';
  }

  resetearFormulario(): void {
    this.idCliente = null;
    this.clienteSeleccionado = null;
    this.carrito = [];
    this.total = 0;
    this.iva = 0;
    this.extras = 0;
    this.descuentos = 0;
    this.idVentaEditando = null;
    this.folioEditando = null;
    const comedor = this.canalesVenta.find((c: any) => c.id === 1);
    this.idCanalVenta = comedor ? comedor.id : null;
    this.formProd.reset({ idProducto: null, cantidad: 1 });

    if (this.route.snapshot.queryParams['editVentaId']) {
      this.router.navigate([], { queryParams: { editVentaId: null }, queryParamsHandling: 'merge' });
    }
  }

  getCanalVentaNombre(): string {
    if (!this.idCanalVenta) return 'Ninguno';
    const canal = this.canalesVenta.find(c => c.id === this.idCanalVenta);
    return canal ? canal.nombre : 'Ninguno';
  }

  get costoTotalCanal(): number {
    if (!this.idCanalVenta) return 0;
    const canal = this.canalesVenta.find(c => c.id === this.idCanalVenta);
    if (!canal) return 0;
    const costoFijo = parseFloat(canal.costo_fijo) || 0;
    const porcentajeComision = parseFloat(canal.porcentaje_comision) || 0;
    const comisionMonto = this.subTotal * (porcentajeComision / 100);
    return costoFijo + comisionMonto;
  }

  // Método para agregar productos rápidamente
  agregarProductoRapido(producto: any): void {
    const item = { 
      ...producto, 
      cantidad: 1, 
      precio: producto.precio, 
      precio_base: producto.precio, 
      subtotal: producto.precio, 
      promocion: '' 
    };
    
    this.preciosService.obtenerPrecioFinal(producto.id, this.idSucursal, this.idCliente, 1).subscribe({
      next: (data: any) => {
        if (data && data.success !== false) {
          item.precio = data.precio_final;
          if (data.aplica_promocion) {
            item.promocion = data.promocion_descripcion;
          } else {
            item.promocion = '';
          }
        }
        item.subtotal = item.cantidad * item.precio;
        this.carrito.unshift(item);
        this.calcularTotal();
        
        this.validarPromocionDinamica(item);
      },
      error: (err) => {
        console.error('Error al obtener el precio final:', err);
        this.carrito.unshift(item);
        this.calcularTotal();
      }
    });
  }

  decrementarCantidad(item:any){
    if(item.cantidad>1){
      item.cantidad --;
    }
    this.actualizarSubtotal(item)
  }

  incrementarCantidad(item:any){
    item.cantidad ++;
    this.actualizarSubtotal(item)
  }

  solicitarAutorizacionPrecio(item: any) {
    Swal.fire({
      title: 'Autorización de Supervisor',
      html: `
        <div class="mb-3" style="text-align: left;">
          <label for="swal-user" class="form-label font-weight-bold">Usuario Supervisor</label>
          <input id="swal-user" class="form-control" placeholder="Ingrese usuario">
        </div>
        <div class="mb-3" style="text-align: left;">
          <label for="swal-pass" class="form-label font-weight-bold">Contraseña</label>
          <input id="swal-pass" type="password" class="form-control" placeholder="Ingrese contraseña">
        </div>
        <div class="mb-3" style="text-align: left;">
          <label for="swal-price" class="form-label font-weight-bold">Nuevo Precio</label>
          <input id="swal-price" type="number" class="form-control" placeholder="0.00" value="${item.precio}">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Autorizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      preConfirm: () => {
        const user = (document.getElementById('swal-user') as HTMLInputElement).value;
        const password = (document.getElementById('swal-pass') as HTMLInputElement).value;
        const price = parseFloat((document.getElementById('swal-price') as HTMLInputElement).value);

        if (!user || !password || isNaN(price) || price < 0) {
          Swal.showValidationMessage('Todos los campos son obligatorios y el precio debe ser mayor o igual a 0');
          return false;
        }

        return { user, password, price };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const { user, password, price } = result.value;
        this.authService.autorizarPrecio({ user, password }).subscribe({
          next: (res: any) => {
            if (res.success) {
              item.precio = price;
              item.subtotal = item.cantidad * price;
              this.calcularTotal();
              Swal.fire({
                icon: 'success',
                title: 'Precio autorizado',
                text: `El precio de ${item.nombre} se actualizó a $${price}`,
                timer: 1500,
                showConfirmButton: false
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'No autorizado',
                text: res.message || 'No se pudo autorizar el cambio de precio.'
              });
            }
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un error al conectar con el servidor de autorización.'
            });
          }
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
      // Solo deshabilitar si es un producto directo que se inventaría y tiene stock < 1
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

  cambiarTabMovil(tab: 'cliente' | 'productos' | 'carrito'): void {
    this.activeTabMovil = tab;
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  cargarPedidosPendientes(): void {
    this.ordenSeleccionadaDetalle = null;
    this.productosDeOrdenSeleccionada = [];
    this.ventasService.listarVentas().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          const ventasList = res.data || [];
          this.ordenesPendientes = ventasList.filter((v: any) => v.estatus_raw === 2);
        } else if (Array.isArray(res)) {
          this.ordenesPendientes = res.filter((v: any) => v.estatus === 'Orden de Venta' || v.estatus_raw === 2);
        }
      },
      error: (err) => {
        console.error('Error al cargar pedidos pendientes en POS:', err);
      }
    });
  }

  abrirModalPedidosPendientes(): void {
    this.cargarPedidosPendientes();
    const modalElement = document.getElementById('pedidosPendientesModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  toggleDetalleOrden(ord: any): void {
    if (this.ordenSeleccionadaDetalle === ord.id) {
      this.ordenSeleccionadaDetalle = null;
      this.productosDeOrdenSeleccionada = [];
    } else {
      this.ordenSeleccionadaDetalle = ord.id;
      this.productosDeOrdenSeleccionada = [];
      this.cargandoDetalleOrden = true;
      this.ventasService.obtenerDetalleVenta(ord.id).subscribe({
        next: (res: any) => {
          this.cargandoDetalleOrden = false;
          if (res && res.success && res.data) {
            this.productosDeOrdenSeleccionada = res.data.productos || [];
          }
        },
        error: (err) => {
          this.cargandoDetalleOrden = false;
          console.error('Error al obtener detalle de la orden:', err);
        }
      });
    }
  }

  iniciarCobroOrden(orden: any): void {
    this.pago = null;
    this.ventasService.obtenerDetalleVenta(orden.id).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.ordenACobrar = res.data;
          this.estatusEntregaPos = 1;
          this.metodoPagoEntregaPos = 'efectivo';
          
          // Cerrar modal de pedidos pendientes
          const modalElement1 = document.getElementById('pedidosPendientesModal');
          if (modalElement1) {
            const modal1 = bootstrap.Modal.getInstance(modalElement1);
            modal1?.hide();
          }
          
          // Abrir modal de cobro
          setTimeout(() => {
            const modalElement2 = document.getElementById('entregarOrdenPosModal');
            if (modalElement2) {
              const modal2 = new bootstrap.Modal(modalElement2);
              modal2.show();
            }
          }, 300);
        }
      },
      error: (err) => {
        console.error('Error al cargar detalle de orden en POS:', err);
        Swal.fire('Error', 'No se pudo cargar el detalle de la orden.', 'error');
      }
    });
  }

  alCambiarEstatusEntregaPos(): void {
    if (this.estatusEntregaPos === 3) {
      this.metodoPagoEntregaPos = 'credito';
    } else {
      if (this.metodoPagoEntregaPos === 'credito') {
        this.metodoPagoEntregaPos = 'efectivo';
      }
    }
  }

  procesarEntregaPos(): void {
    if (!this.ordenACobrar) return;

    const decryptedIdCaja = CryptoJS.AES.decrypt(localStorage.getItem('idCaja') || '', environment.secretKey).toString(CryptoJS.enc.Utf8);

    const payload = {
      estatus: this.estatusEntregaPos,
      metodo_pago: this.metodoPagoEntregaPos,
      idCaja: decryptedIdCaja ? parseInt(decryptedIdCaja) : null
    };

    this.ventasService.entregarOrden(this.ordenACobrar.id, payload).subscribe({
      next: (res: any) => {
        Swal.fire('Éxito', 'La orden ha sido pagada y entregada correctamente.', 'success');
        
        // Cerrar modal de cobro
        const modalElement = document.getElementById('entregarOrdenPosModal');
        if (modalElement) {
          const modal = bootstrap.Modal.getInstance(modalElement);
          modal?.hide();
        }

        // Imprimir ticket de venta
        try {
          const printData: TicketData = {
            folio: this.ordenACobrar.folio,
            fecha: this.ordenACobrar.fecha,
            cliente: this.ordenACobrar.cliente ? this.ordenACobrar.cliente.nombre : 'Cliente General',
            cajero: this.ordenACobrar.user ? this.ordenACobrar.user.name : 'N/A',
            canal: this.ordenACobrar.canal_venta ? this.ordenACobrar.canal_venta.nombre : (this.ordenACobrar.canalVenta ? this.ordenACobrar.canalVenta.nombre : 'Comedor'),
            metodo_pago: this.metodoPagoEntregaPos,
            subtotal: this.ordenACobrar.subtotal,
            descuentos: this.ordenACobrar.descuentos,
            extras: this.ordenACobrar.extras,
            iva: this.ordenACobrar.iva,
            total: this.ordenACobrar.total,
            pago: this.metodoPagoEntregaPos === 'efectivo' ? this.pago : this.ordenACobrar.total,
            cambio: this.metodoPagoEntregaPos === 'efectivo' ? this.pago-this.ordenACobrar.total : 0,
            productos: (this.ordenACobrar.productos || []).map((prod: any) => ({
              nombre: prod.nombre,
              cantidad: prod.pivot.cantidad,
              precio: prod.pivot.precio,
              total: prod.pivot.total,
              promocion: prod.pivot.promocion
            }))
          };
          this.printService.imprimirTicket(printData);
        } catch (printErr) {
          console.error('Error al imprimir ticket de entrega en POS:', printErr);
        }

        this.cargarPedidosPendientes();
        this.ordenACobrar = null;
      },
      error: (err) => {
        console.error('Error al completar la entrega en POS:', err);
        Swal.fire('Error', err.error?.message || 'Error al procesar la entrega de la orden.', 'error');
      }
    });
  }
}
