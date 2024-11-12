import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductosService } from '../../../services/productos.service';
import Swal from 'sweetalert2'

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
  selProducto: string = '';
  selIdProducto: number = 0;

    constructor(private fb: FormBuilder, private productoService: ProductosService){
      this.formProd = this.fb.group({
        id: [null, Validators.required],
        nombre: [null, Validators.required],
        codigo: [null, Validators.required],
        inventariar: [0, Validators.required],
      });
      this.formPrecio = this.fb.group({
        idSucursal: [0, Validators.required],
        idProducto: [0, Validators.required],
        nombre: [null, Validators.required],
        precio: [0.0, Validators.required],
      });
      this.formInventario = this.fb.group({
        idSucursal: [0, Validators.required],
        idProducto: [0, Validators.required],
        nombre: [null, Validators.required],
        inventario: [0, Validators.required],
      });
    }

    ngOnInit(): void {
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

    modificarPrecio(idProducto:number, producto: string){
      
    }

    modificarInventario(idProducto:number, producto: string){

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
                  console.log(data);
                }
              },
              error: (err) => { 
                alert("Error al listar"),
                console.log(err);
               },
            });
          }
        },
        error: (err) => { 
          alert("Error al guardar, inetente mas tarde"),
          console.log(err);
         },
      });
    }

}
