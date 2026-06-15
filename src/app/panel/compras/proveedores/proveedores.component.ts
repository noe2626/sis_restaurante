import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SucursalesService } from '../../../services/sucursales.service';
import { ProveedoresService } from '../../../services/proveedores.service';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css'
})
export class ProveedoresComponent {
  data: Array<any> = [];
  idSucursal:any;
  sucursales: any = null;
  displayedColumns: string[] = ['nombre','email','telefono','rfc', 'estatus', 'modificar', 'eliminar']; 
  dataSource = new MatTableDataSource<any>([]);
  totalItems = 0;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  formPro: FormGroup;

  originalData = [JSON.parse(JSON.stringify(this.data))]; // Copia profunda de los datos originales 

  filteredData = [...this.data];

  constructor(private sucursalesService: SucursalesService,
    private proveedoresService: ProveedoresService,
    private fb: FormBuilder){
      this.formPro = this.fb.group({
        id: [null],
        nombre: [null, Validators.required],
        email: [null, [Validators.required, Validators.email]],
        telefono: [null, Validators.required],
        rfc: [null, Validators.required],
        estatus: [1],
      });
  }

  ngOnInit(): void { 
    this.idSucursal = localStorage.getItem('idSucursal');
    this.sucursalesService.getSucursalesByUsuario().subscribe({
      next: (data:any) => {
        if (data.success) {
          this.sucursales=data.data
        }
      },
      error: () => { alert("Error al actualizar") },
    });
    this.listarProveedores();
  }

  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredData = this.data.filter(item => 
      item.nombre.toLowerCase().includes(searchTerm) || item.email.toLowerCase().includes(searchTerm)
    );
    this.dataSource.data = this.filteredData;
    this.dataSource.paginator = this.paginator;
    this.totalItems = this.filteredData.length;
  }

  guardar(): void {
    let proveedor=this.formPro.getRawValue();
    this.proveedoresService.guardarProveedor(proveedor).subscribe({
      next: (data:any) => {
        if (data.success) {
          this.listarProveedores();
          Swal.fire({
            icon: "success",
            title: "Proveedor guardado",
            showConfirmButton: false,
            timer: 1500
          });
        }else{
          Swal.fire({
            icon: "error",
            title: data.message || "Error al guardar",
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

  listarProveedores(){
    this.proveedoresService.listarProveedores().subscribe({
      next: (data:any) => {
        if (data.success) {
          this.data=data.data;
          this.originalData = JSON.parse(JSON.stringify(this.data));
          this.filteredData = [...this.data];
          this.dataSource.data = this.filteredData;
          this.dataSource.paginator = this.paginator;
          this.totalItems = this.filteredData.length;
        }else{
          Swal.fire({
            icon: "error",
            title: "Error al cargar proveedores",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => { 
        console.log(err);
        Swal.fire({
          icon: "error",
          title: "Error al cargar proveedores",
          showConfirmButton: false,
          timer: 1500
        });
      },
    });
  }

  nuevoProveedor(){
    this.formPro.get('nombre')?.enable();
    let proveedor = {
      id: null,
      nombre: null,
      email: null,
      telefono: null,
      rfc: null,
      estatus: 1,
    }
    this.formPro.setValue(proveedor);
  }

  setEditar(prov: any){
    this.formPro.get('nombre')?.enable();
    let proveedor = {
      id: prov.id,
      nombre: prov.nombre,
      email: prov.email,
      telefono: prov.telefono,
      rfc: prov.rfc,
      estatus: prov.estatus,
    }
    this.formPro.setValue(proveedor);
    if (prov.id === 1) {
      this.formPro.get('nombre')?.disable();
    }
  }

  toggleEstatus(prov: any) {
    if (prov.id === 1) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se puede desactivar el proveedor general.'
      });
      return;
    }

    const nuevoEstado = prov.estatus == 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'reactivar' : 'dar de baja';

    Swal.fire({
      title: `¿Quieres ${accion} al proveedor?`,
      text: `El proveedor "${prov.nombre}" cambiará a estado ${nuevoEstado === 1 ? 'activo' : 'inactivo'}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: nuevoEstado === 1 ? '#28a745' : '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        if (nuevoEstado === 0) {
          this.proveedoresService.eliminarProveedor(prov.id).subscribe({
            next: (data: any) => {
              if (data.success) {
                this.listarProveedores();
                Swal.fire({
                  icon: 'success',
                  title: 'Dado de baja',
                  text: 'El proveedor ha sido dado de baja.',
                  showConfirmButton: false,
                  timer: 1500
                });
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: data.message || 'No se pudo dar de baja al proveedor.'
                });
              }
            },
            error: (err) => {
              console.error(err);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un error al dar de baja al proveedor.'
              });
            }
          });
        } else {
          const payload = {
            id: prov.id,
            nombre: prov.nombre,
            email: prov.email,
            telefono: prov.telefono,
            rfc: prov.rfc,
            estatus: 1
          };
          this.proveedoresService.guardarProveedor(payload).subscribe({
            next: (data: any) => {
              if (data.success) {
                this.listarProveedores();
                Swal.fire({
                  icon: 'success',
                  title: 'Reactivado',
                  text: 'El proveedor ha sido reactivado.',
                  showConfirmButton: false,
                  timer: 1500
                });
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: data.message || 'No se pudo reactivar al proveedor.'
                });
              }
            },
            error: (err) => {
              console.error(err);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un error al reactivar al proveedor.'
              });
            }
          });
        }
      }
    });
  }


}
