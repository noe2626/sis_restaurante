import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductosService } from '../../../services/productos.service';
import Swal from 'sweetalert2'
import { SucursalesService } from '../../../services/sucursales.service';
import { PreciosService } from '../../../services/precios.service';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit{
  formProd: FormGroup;
  formPrecio: FormGroup;
  formInventario: FormGroup;
  productos: Array<any> = [];
  sucursales: Array<any> = [];
  idSucursal: number = 0;
  selProducto: string = '';
  selIdProducto: number = 0;

    constructor(private fb: FormBuilder, 
      private productoService: ProductosService,
      private precioService: PreciosService,
    private sucursalesService: SucursalesService){
      
      
      this.formProd = this.fb.group({
        id: [null, Validators.required],
        nombre: [null, Validators.required],
        codigo: [null, Validators.required],
        inventariar: [0, Validators.required],
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

    listarProductos(){
      this.productoService.listarProductos().subscribe({
        next: (data:any) => {
          if (data.success) {
            this.productos=data.data;
          }else{
            console.log(data);
          }
        },
        error: (err) => { 
          console.log(err);
         },
      });
    }

    getSucursales(){
      this.sucursalesService.getSucursalesByUsuario().subscribe({
        next: (data:any) => {
          if (data.success) {
            this.sucursales=data.data
          }
        },
        error: () => { alert("Error al cargar sucursales") },
      });
    }

    nuevoProducto(){
      let producto = {
        id: null,
        nombre: null,
        codigo: null,
        inventariar: false
      }
      this.formProd.setValue(producto);
    }

    setEditar(prod: any){
      let producto = {
        id: prod.id,
        nombre: prod.nombre,
        codigo: prod.codigo,
        inventariar: prod.inventariar
      }
      this.formProd.setValue(producto);
    }

    cargarPreciosData(idProducto:any, producto:string){
      this.formPrecio.patchValue({idProducto:idProducto, nombre:producto});
      this.getSucursales();
      this.getPrecioProducto();
    }

    cargarInventariosData(idProducto:any, producto:string){
      this.formInventario.patchValue({idProducto:idProducto, nombre:producto});
      this.getSucursales();
      this.getInventarioProducto()
    }

    changeSucursalPrecio(){
      this.getPrecioProducto();
    }

    changeSucursalInventario(){
      this.getInventarioProducto();
    }

    getPrecioProducto(){
      let precioData = this.formPrecio.value;
      this.precioService.getPrecioProducto(precioData.idSucursal,precioData.idProducto).subscribe({
        next: (data:any) => {
          if (data.success) {
            this.formPrecio.patchValue({precio:data.data.precio});
          }else{
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

    modificarPrecio(){
      let precioData = this.formPrecio.value;
      this.precioService.setPreciosSucursal(precioData).subscribe({
        next: (data:any) => {
          if (data.success) {
            Swal.fire({
              icon: "success",
              title: "Guardado",
              showConfirmButton: false,
              timer: 1500
            });
          }else{
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

    getInventarioProducto(){
      let inventarioData = this.formInventario.value;
      this.productoService.getInventarioProducto(inventarioData.idProducto).subscribe({
        next: (data:any) => {
          if (data.success) {
            this.formInventario.patchValue({cantidad:data.data.cantidad});
          }else{
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

    modificarInventario(){
      let inventarioData = this.formInventario.value;
      
      this.productoService.setInventarioProducto(inventarioData).subscribe({
        next: (data:any) => {
          if (data.success) {
            Swal.fire({
              icon: "success",
              title: "Guardado",
              showConfirmButton: false,
              timer: 1500
            });
          }else{
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

    onSubmit(){
      let dataProd=this.formProd.value;
      
      if(dataProd.codigo == null){
        dataProd.codigo=''
      }

      this.productoService.guardarProducto(dataProd).subscribe({
        next: (data:any) => {
          if (data.success) {
            Swal.fire({
              icon: "success",
              title: "Guardado",
              showConfirmButton: false,
              timer: 1500
            });
            this.productoService.listarProductos().subscribe({
              next: (data:any) => {
                if (data.success) {
                  this.productos=data.data;
                }else{
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

}
