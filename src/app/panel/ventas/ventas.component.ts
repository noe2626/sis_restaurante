import { AfterViewInit, Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { switchMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductosService } from '../../services/productos.service';
import { VentasService } from '../../services/ventas.service';
import { ClientesService } from '../../services/clientes.service';
import { PreciosService } from '../../services/precios.service';

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
  productosFiltrados$: Observable<any[]> = of([]);
  typeaheadInput$ = new Subject<string>();
  pago:number = 0;
  cambio:number = 0;

  // Definimos e inicializamos productosRapidos
  productosRapidos: any[] = [
    { id: 1, nombre: 'Producto A', precio: 100 },
    { id: 2, nombre: 'Producto B', precio: 150 },
    { id: 3, nombre: 'Producto C', precio: 200 },
    { id: 1, nombre: 'Producto A', precio: 100 },
    { id: 2, nombre: 'Producto B', precio: 150 },
    { id: 3, nombre: 'Producto C', precio: 200 },
    { id: 1, nombre: 'Producto A', precio: 100 },
    { id: 2, nombre: 'Producto B', precio: 150 },
    { id: 3, nombre: 'Producto C', precio: 200 },
    { id: 1, nombre: 'Producto A', precio: 100 },
    { id: 2, nombre: 'Producto B', precio: 150 },
    { id: 3, nombre: 'Producto C', precio: 200 }
  ];

  constructor(
    private fb: FormBuilder,
    private productoService: ProductosService,
    private ventasService: VentasService,
    private clientesService: ClientesService,
    private preciosService: PreciosService
  ) {
    this.formProd = this.fb.group({
      idProducto: [null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });
  }



  ngOnInit(): void {
    this.listarProductos();
    this.listarClientes();
  }

  listarProductos(): void {
    this.productoService.listarProductos().subscribe({
      next: (data: any) => {
        console.log(data.data);
        
        this.productos = data.data || [];
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
      const idSucursal = 1; // Actualiza esto según tu lógica
      this.preciosService.obtenerPrecioBase(idProducto, idSucursal).subscribe({
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
      this.preciosService.obtenerPrecioFinal(idProducto, 1, this.idCliente, cantidad).subscribe({
        next: (data: any) => {
          if (data.aplica_promocion) {
            item.precio = data.precio_final;
            item.promocion = data.promocion_descripcion;
            item.subtotal = item.cantidad * item.precio;
          }
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
    this.preciosService.obtenerPrecioFinal(item.id, 1, this.idCliente, item.cantidad).subscribe({
      next: (data: any) => {
        if (data.aplica_promocion) {
          item.precio = data.precio_final;
          item.promocion = data.promocion_descripcion;
          item.subtotal = item.cantidad * item.precio;
        }
        this.calcularTotal();
        this.validarPromocionDinamica(item);
      },
      error: (err) => {
        console.log('Error al obtener el precio final:', err);
      }
    });
  }

  validarPromocionDinamica(item: any): void {
    this.preciosService.validarPromocionDinamica(item.id, 1, item.cantidad).subscribe({
      next: (data: any) => {
        if (data.aplica_promocion) {
          const vecesPromocion = Math.floor(item.cantidad / 2); // Dado el ejemplo de 2x1
          const cantidadGratis = vecesPromocion * 1; // Cantidad gratis por cada promoción
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

    this.total = (this.subTotal + extras - descuentos) + this.iva
  }

  eliminarProducto(index: number): void {
    this.carrito.splice(index, 1);
    this.calcularTotal();
  }

  finalizarVenta(): void {
    const venta = {
      idCliente: this.idCliente,
      total: this.total,
      descuentos: this.descuentos,
      extras: this.extras,
      iva: this.iva,
      productos: this.carrito.map(item => ({
        idProducto: item.id,
        cantidad: item.cantidad,
        precio: item.precio,
        promocion: item.promocion
      }))
    };

    /*this.ventasService.registrarVenta(venta).subscribe({
      next: (data: any) => {
        console.log('Venta registrada con éxito:', data);
        this.resetearFormulario();
      },
      error: (err) => {
        console.log('Error al registrar la venta:', err);
      }
    });*/
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
}
