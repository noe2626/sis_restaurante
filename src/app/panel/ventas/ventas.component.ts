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
import * as bootstrap from "bootstrap";
import CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';

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

  constructor(
    private fb: FormBuilder,
    private productoService: ProductosService,
    private ventasService: VentasService,
    private clientesService: ClientesService,
    private preciosService: PreciosService,
    private authService: AuthService,
    private canalesVentaService: CanalesVentaService,
    private renderer: Renderer2
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
    this.listarProductos();
    this.listarProductosMasVendidos();
    this.listarClientes();
    this.listarCanalesVenta();
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

  pagar(){
    this.metodoPago = 'efectivo';
    this.pago=null;
    setTimeout(() => {
      var pagoInput = document.getElementById("pagoInput");
      pagoInput?.focus();
      
    }, 500);
  }

  alCambiarMetodoPago(): void {
    if (this.metodoPago !== 'efectivo') {
      this.pago = this.total;
    } else {
      this.pago = null;
      setTimeout(() => {
        document.getElementById("pagoInput")?.focus();
      }, 100);
    }
  }


  registrarVenta(): void {
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
      productos: this.carrito.map(item => ({
        idProducto: item.id,
        cantidad: item.cantidad,
        precio: item.precio,
        promocion: item.promocion,
        total: item.subtotal
      }))
    };
    this.ventasService.registrarVenta(venta).subscribe({
      next: (data: any) => {
        
        Swal.fire({
          icon: "success",
          title: "Venta registrada conrrectamente",
          showConfirmButton: false,
          timer: 1500
        });
        this.cambio = this.pago - this.total;
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
    this.carrito = [];
    this.total = 0;
    this.iva = 0;
    this.extras = 0;
    this.descuentos = 0;
    const comedor = this.canalesVenta.find((c: any) => c.id === 1);
    this.idCanalVenta = comedor ? comedor.id : null;
    this.formProd.reset({ idProducto: null, cantidad: 1 });
  }

  getCanalVentaNombre(): string {
    if (!this.idCanalVenta) return 'Ninguno';
    const canal = this.canalesVenta.find(c => c.id === this.idCanalVenta);
    return canal ? canal.nombre : 'Ninguno';
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
    if (item.inventariar || item.tiene_componentes) {
      return (item.stock_disponible || 0) < 1;
    }
    return false;
  }
}
