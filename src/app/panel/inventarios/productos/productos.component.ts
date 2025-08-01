import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductosService } from '../../../services/productos.service';
import Swal from 'sweetalert2';
import { SucursalesService } from '../../../services/sucursales.service';
import { PreciosService } from '../../../services/precios.service';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {
  formProd: FormGroup;
  formPrecio: FormGroup;
  formInventario: FormGroup;

  productos: any[] = [];
  productosFiltrados: any[] = [];
  sucursales: any[] = [];
  componentes: any[] = [];
  productosComponentes: any[] = [];

  idSucursal: number = 0;
  idComponente: any = null;
  productoSeleccionado: any = null;
  cantidadComponente: number = 1;

  constructor(
    private fb: FormBuilder,
    private productoService: ProductosService,
    private precioService: PreciosService,
    private sucursalesService: SucursalesService
  ) {
    this.formProd = this.fb.group({
      id: [null, Validators.required],
      nombre: [null, Validators.required],
      codigo: [null, Validators.required],
      inventariar: [false, Validators.required],
    });

    this.formPrecio = this.fb.group({
      idSucursal: [localStorage.getItem('idSucursal'), Validators.required],
      idProducto: [0, Validators.required],
      nombre: [null, Validators.required],
      precio: [0.0, Validators.required],
    });

    this.formInventario = this.fb.group({
      idSucursal: [localStorage.getItem('idSucursal'), Validators.required],
      idProducto: [0, Validators.required],
      nombre: [null, Validators.required],
      cantidad: [0, Validators.required],
    });
  }

  ngOnInit(): void {
    this.listarProductos();
  }

  listarProductos() {
    this.productoService.listarProductos().subscribe({
      next: (data: any) => {
        if (data.success) {
          this.productos = data.data;
          this.filtrarProductos('');
        } else {
          console.log(data);
        }
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  filtrarProductos(termino: string) {
    const searchTerm = termino.toLowerCase();
    this.productosFiltrados = this.productos.filter(prod =>
      prod.nombre.toLowerCase().includes(searchTerm) ||
      (prod.codigo && prod.codigo.toString().includes(searchTerm))
    );
  }

  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.filtrarProductos(searchTerm);
  }

  getSucursales() {
    this.sucursalesService.getSucursalesByUsuario().subscribe({
      next: (data: any) => {
        if (data.success) {
          this.sucursales = data.data;
        }
      },
      error: () => {
        alert("Error al cargar sucursales");
      },
    });
  }

  nuevoProducto() {
    const producto = {
      id: null,
      nombre: null,
      codigo: null,
      inventariar: false
    };
    this.formProd.setValue(producto);
  }

  setEditar(prod: any) {
    const producto = {
      id: prod.id,
      nombre: prod.nombre,
      codigo: prod.codigo,
      inventariar: prod.inventariar
    };
    this.formProd.setValue(producto);
  }

  cargarPreciosData(idProducto: any, producto: string) {
    this.formPrecio.patchValue({ idProducto: idProducto, nombre: producto });
    this.getSucursales();
    this.getPrecioProducto();
  }

  cargarInventariosData(idProducto: any, producto: string) {
    this.formInventario.patchValue({ idProducto: idProducto, nombre: producto });
    this.getSucursales();
    this.getInventarioProducto();
  }

  changeSucursalPrecio() {
    this.getPrecioProducto();
  }

  changeSucursalInventario() {
    this.getInventarioProducto();
  }

  getPrecioProducto() {
    const precioData = this.formPrecio.value;
    this.precioService.getPrecioProducto(precioData.idSucursal, precioData.idProducto).subscribe({
      next: (data: any) => {
        if (data.success) {
          this.formPrecio.patchValue({ precio: data.data.precio });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error al listar",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "Error al listar",
          showConfirmButton: false,
          timer: 1500
        });
        console.log(err);
      },
    });
  }

  modificarPrecio() {
    const precioData = this.formPrecio.value;
    this.precioService.setPreciosSucursal(precioData).subscribe({
      next: (data: any) => {
        if (data.success) {
          Swal.fire({
            icon: "success",
            title: "Guardado",
            showConfirmButton: false,
            timer: 1500
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error al guardar",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "Error al guardar",
          showConfirmButton: false,
          timer: 1500
        });
        console.log(err);
      },
    });
  }

  getInventarioProducto() {
    const inventarioData = this.formInventario.value;
    this.productoService.getInventarioProducto(inventarioData.idProducto).subscribe({
      next: (data: any) => {
        if (data.success) {
          this.formInventario.patchValue({ cantidad: data.data.cantidad });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error al listar",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "Error al listar",
          showConfirmButton: false,
          timer: 1500
        });
        console.log(err);
      },
    });
  }

  modificarInventario() {
    const inventarioData = this.formInventario.value;
    this.productoService.setInventarioProducto(inventarioData).subscribe({
      next: (data: any) => {
        if (data.success) {
          Swal.fire({
            icon: "success",
            title: "Guardado",
            showConfirmButton: false,
            timer: 1500
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error al guardar",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "Error al guardar",
          showConfirmButton: false,
          timer: 1500
        });
        console.log(err);
      },
    });
  }

  onSubmit() {
    let dataProd = this.formProd.value;
    if (dataProd.codigo == null) {
      dataProd.codigo = '';
    }

    this.productoService.guardarProducto(dataProd).subscribe({
      next: (data: any) => {
        if (data.success) {
          Swal.fire({
            icon: "success",
            title: "Guardado",
            showConfirmButton: false,
            timer: 1500
          });
          this.listarProductos();
        }
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "Error al guardar",
          showConfirmButton: false,
          timer: 1500
        });
        console.log(err);
      },
    });
  }


  cargarComponentes(producto: any) {
    this.productoSeleccionado = producto;
    this.productoService.getComponentesProducto(producto.id).subscribe({
      next: (data: any) => {
        if (data.success) {
          this.componentes = data.data;
          let idComponentesActuales = this.componentes.map(c => c.idProducto);
          this.productosComponentes = this.productos.filter(componente =>
          componente.inventariar == 1 
          && componente.id != producto.id 
          && !idComponentesActuales.includes(componente.id));
          console.log(this.productosComponentes);
          
        } else {
          Swal.fire({
            icon: "error",
            title: "Error al listar",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "Error al listar",
          showConfirmButton: false,
          timer: 1500
        });
        console.log(err);
      },
    });
  }

  customSearch(term: string, item: any) {
    term = term.toLowerCase();

    const codigoMatch = item.codigo && item.codigo.toLowerCase().includes(term);
    const nombreMatch = item.nombre.toLowerCase().includes(term);
    
    return nombreMatch || codigoMatch;
  }

  agregarComponente(){
    let componente = {
      producto_id: this.productoSeleccionado.id,
      componente_id: this.idComponente,
      cantidad: this.cantidadComponente
    }
    this.productoService.guardarComponentesProducto(componente).subscribe({
      next: (data: any) => {
        if (data.success) {
          this.idComponente = null;
          this.cantidadComponente = 1;
          this.cargarComponentes(this.productoSeleccionado);
        } else {
          Swal.fire({
            icon: "error",
            title: "Error al guardar",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => {
        console.log(err);
        Swal.fire({
            icon: "error",
            title: "Error al guardar",
            showConfirmButton: false,
            timer: 1500
          });
      },
    });
  }

  eliminarComponente(componente: any){

    Swal.fire({
      title: "Eliminar componente " + componente.producto,
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#90a1b1ff",
      cancelButtonColor: "#d33",
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService.deleteComponentesProducto(componente.id).subscribe({
          next: (data: any) => {
            if (data.success) {
              this.cargarComponentes(this.productoSeleccionado);
            } else {
              Swal.fire({
                icon: "error",
                title: "Error al eliminar",
                showConfirmButton: false,
                timer: 1500
              });
            }
          },
          error: (err) => {
            console.log(err);
            Swal.fire({
                icon: "error",
                title: "Error al eliminar",
                showConfirmButton: false,
                timer: 1500
              });
          },
        });
      }
    });
  }

}
