import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SucursalesService } from '../../services/sucursales.service';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-sucursales-admin',
  templateUrl: './sucursales.component.html',
  styleUrl: './sucursales.component.css'
})
export class SucursalesAdminComponent implements OnInit {
  sucursales: any[] = [];
  loading: boolean = true;
  searchText: string = '';

  get sucursalesFiltradas(): any[] {
    if (!this.searchText.trim()) {
      return this.sucursales;
    }
    const text = this.searchText.toLowerCase().trim();
    return this.sucursales.filter(s => 
      s.nombre.toLowerCase().includes(text) || 
      s.direccion.toLowerCase().includes(text)
    );
  }

  sucursalForm: FormGroup;
  isEditMode: boolean = false;
  selectedSucursalId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private sucursalesService: SucursalesService
  ) {
    this.sucursalForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(255)]],
      direccion: ['', [Validators.required, Validators.maxLength(255)]],
      maneja_iva: [false],
      imprime_ticket: [true],
      bloqueo_stock: ['estricto', Validators.required],
      estatus: [1, Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.sucursalesService.getAllSucursales().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.sucursales = res.data;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar sucursales:', err);
        Swal.fire('Error', 'No se pudieron cargar las sucursales.', 'error');
        this.loading = false;
      }
    });
  }

  abrirModalNuevo(): void {
    this.isEditMode = false;
    this.selectedSucursalId = null;
    this.sucursalForm.reset({
      nombre: '',
      direccion: '',
      maneja_iva: false,
      imprime_ticket: true,
      bloqueo_stock: 'estricto',
      estatus: 1
    });

    const modal = new bootstrap.Modal(document.getElementById('sucursalAdminModal'));
    modal.show();
  }

  abrirModalEditar(sucursal: any): void {
    this.isEditMode = true;
    this.selectedSucursalId = sucursal.id;
    this.sucursalForm.patchValue({
      nombre: sucursal.nombre,
      direccion: sucursal.direccion,
      maneja_iva: sucursal.maneja_iva == 1 || sucursal.maneja_iva == true,
      imprime_ticket: sucursal.imprime_ticket == 1 || sucursal.imprime_ticket == true,
      bloqueo_stock: sucursal.bloqueo_stock || 'estricto',
      estatus: sucursal.estatus
    });

    const modal = new bootstrap.Modal(document.getElementById('sucursalAdminModal'));
    modal.show();
  }

  guardarSucursal(): void {
    if (this.sucursalForm.invalid) {
      this.sucursalForm.markAllAsTouched();
      return;
    }

    const payload = {
      nombre: this.sucursalForm.value.nombre,
      direccion: this.sucursalForm.value.direccion,
      maneja_iva: this.sucursalForm.value.maneja_iva ? 1 : 0,
      imprime_ticket: this.sucursalForm.value.imprime_ticket ? 1 : 0,
      bloqueo_stock: this.sucursalForm.value.bloqueo_stock,
      estatus: this.sucursalForm.value.estatus
    };

    if (this.isEditMode && this.selectedSucursalId) {
      this.sucursalesService.updateSucursal(this.selectedSucursalId, payload).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            Swal.fire('Éxito', 'Sucursal actualizada correctamente.', 'success');
            this.cerrarModal();
            this.cargarDatos();
          } else {
            Swal.fire('Error', res.message || 'No se pudo actualizar la sucursal.', 'error');
          }
        },
        error: (err) => {
          console.error('Error al actualizar sucursal:', err);
          Swal.fire('Error', err.error?.message || 'Error al actualizar la sucursal.', 'error');
        }
      });
    } else {
      this.sucursalesService.createSucursal(payload).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            Swal.fire('Éxito', 'Sucursal creada correctamente.', 'success');
            this.cerrarModal();
            this.cargarDatos();
          } else {
            Swal.fire('Error', res.message || 'No se pudo crear la sucursal.', 'error');
          }
        },
        error: (err) => {
          console.error('Error al crear sucursal:', err);
          Swal.fire('Error', err.error?.message || 'Error al crear la sucursal.', 'error');
        }
      });
    }
  }

  cerrarModal(): void {
    const modalElement = document.getElementById('sucursalAdminModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
      modal.hide();
    }
  }

  toggleEstatusSucursal(sucursal: any): void {
    if (sucursal.id === 1) {
      Swal.fire('Acción Prohibida', 'La sucursal principal no puede ser desactivada/dada de baja.', 'warning');
      return;
    }

    const nuevoEstado = sucursal.estatus === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'activar/dar de alta' : 'dar de baja';

    Swal.fire({
      title: `¿Quieres ${accion} la sucursal?`,
      text: `La sucursal "${sucursal.nombre}" cambiará a estado ${nuevoEstado === 1 ? 'activo' : 'inactivo'}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: nuevoEstado === 1 ? '#28a745' : '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        if (nuevoEstado === 0) {
          // Inactivación lógica usando deleteSucursal (que hace estatus = 0)
          this.sucursalesService.deleteSucursal(sucursal.id).subscribe({
            next: (res: any) => {
              if (res && res.success) {
                Swal.fire('Éxito', 'La sucursal ha sido dada de baja.', 'success');
                this.cargarDatos();
              } else {
                Swal.fire('Error', res.message || 'No se pudo dar de baja la sucursal.', 'error');
              }
            },
            error: (err) => {
              console.error('Error al dar de baja:', err);
              Swal.fire('Error', err.error?.message || 'Error al dar de baja la sucursal.', 'error');
            }
          });
        } else {
          // Reactivación usando updateSucursal con estatus: 1
          const payload = {
            nombre: sucursal.nombre,
            direccion: sucursal.direccion,
            maneja_iva: sucursal.maneja_iva,
            imprime_ticket: sucursal.imprime_ticket,
            estatus: 1
          };
          this.sucursalesService.updateSucursal(sucursal.id, payload).subscribe({
            next: (res: any) => {
              if (res && res.success) {
                Swal.fire('Éxito', 'La sucursal ha sido reactivada correctamente.', 'success');
                this.cargarDatos();
              } else {
                Swal.fire('Error', res.message || 'No se pudo reactivar la sucursal.', 'error');
              }
            },
            error: (err) => {
              console.error('Error al reactivar:', err);
              Swal.fire('Error', err.error?.message || 'Error al reactivar la sucursal.', 'error');
            }
          });
        }
      }
    });
  }
}
