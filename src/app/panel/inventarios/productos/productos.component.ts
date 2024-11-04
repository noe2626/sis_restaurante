import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductosService } from '../../../services/productos.service';
import { log } from 'console';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit{
  formProd: FormGroup;

    productos: Array<any> = [];

    constructor(private fb: FormBuilder, private productoService: ProductosService){
      this.formProd = this.fb.group({
        nombre: [null, Validators.required],
        codigo: [null, Validators.required],
        precio: [null, Validators.required],
        inventariar: [0, Validators.required],
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
          alert("Error al listar"),
          console.log(err);
          
         },
      });
    }

    onSubmit(){
      let dataProd=this.formProd.value;
      console.log(dataProd);
      
      if(dataProd.codigo == null){
        dataProd.codigo=''
      }

      this.productoService.guardarProducto(dataProd).subscribe({
        next: (data:any) => {
          if (data.success) {
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
