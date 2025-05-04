import { AfterViewInit, Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { switchMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductosService } from '../../services/productos.service';
import { VentasService } from '../../services/ventas.service';
import { ClientesService } from '../../services/clientes.service';
import { PreciosService } from '../../services/precios.service';
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
  typeaheadInput$ = new Subject<string>();
  pago:any = 0;
  cambio:number = 0;
  idSucursal:any = 0;
  productosRapidos: any[] = [];

  constructor(
    private fb: FormBuilder,
    private productoService: ProductosService,
    private ventasService: VentasService,
    private clientesService: ClientesService,
    private preciosService: PreciosService,
    private renderer: Renderer2
  ) {
    this.formProd = this.fb.group({
      idProducto: [null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });
    this.idSucursal=localStorage.getItem('idSucursal');
  }



  ngOnInit(): void {
    this.listarProductos();
    this.listarProductosMasVendidos();
    this.listarClientes();
  }

  listarProductos(): void {
    this.productoService.listarProductos().subscribe({
      next: (data: any) => {
        this.productos = data.data.map((producto:any) => ({ 
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
        this.productosRapidos = data.data.map((producto:any) => ({ 
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
        this.clientes = data || [];
      },
      error: (err) => {
        console.log(err);
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
    const producto = this.productos.find(p => p.id === idProducto);
    if (producto) {
      const item = { ...producto, cantidad, precio: this.precioProd, subtotal: this.precioProd * cantidad, promocion: '' };

      // Obtener el precio final y promoción al agregar el producto
      this.preciosService.obtenerPrecioFinal(idProducto, this.idSucursal, this.idCliente, cantidad).subscribe({
        next: (data: any) => {
          if (data.aplica_promocion) {
            item.precio = data.precio_final;
            item.promocion = data.promocion_descripcion;
          }
          item.subtotal = item.cantidad * item.precio;
          this.carrito.unshift(item);
          this.calcularTotal();
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
    item.subtotal = item.cantidad * item.precio;
    this.calcularTotal();
    this.validarPromocionDinamica(item);
  }

  validarPromocionDinamica(item: any): void {
    this.preciosService.validarPromocionDinamica(item.id, this.idSucursal, item.cantidad).subscribe({
      next: (data: any) => {
        if (data.aplica_promocion) {
          const vecesPromocion = Math.floor(item.cantidad / 2); 
          const cantidadGratis = vecesPromocion * 1; 
          const cantidadTotal = item.cantidad - cantidadGratis;
          item.subtotal = cantidadTotal * item.precio;
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
    const descuentos = this.descuentos;
    const extras = this.extras;
    this.iva = (this.subTotal + extras - descuentos) * 0.16;

    this.total = (this.subTotal + extras - descuentos) //+ this.iva
  }

  eliminarProducto(index: number): void {
    this.carrito.splice(index, 1);
    this.calcularTotal();
  }

  pagar(){
    this.pago=null;
    setTimeout(() => {
      var pagoInput = document.getElementById("pagoInput");
      pagoInput?.focus();
      
    }, 500);
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
  }

  resetearFormulario(): void {
    this.idCliente = null;
    this.carrito = [];
    this.total = 0;
    this.iva = 0;
    this.extras = 0;
    this.descuentos = 0;
    this.formProd.reset({ idProducto: null, cantidad: 1 });
  }

  // Método para agregar productos rápidamente
  agregarProductoRapido(producto: any): void {
    const item = { ...producto, cantidad: 1, precio: producto.precio, subtotal: producto.precio, promocion: '' };
    this.carrito.unshift(item);
    this.calcularTotal();
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

  isDisabled(item: any): boolean { 
    return item.inventariar && item.cantidad < 1; 
  }
}
