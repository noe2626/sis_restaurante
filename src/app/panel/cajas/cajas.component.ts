import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CajasService } from '../../services/cajas.service';
import { SucursalesService } from '../../services/sucursales.service';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-cajas-admin',
  templateUrl: './cajas.component.html',
  styleUrl: './cajas.component.css'
})
export class CajasAdminComponent implements OnInit {
  cajas: any[] = [];
  sucursales: any[] = [];
  loading: boolean = true;
  searchText: string = '';

  cajaForm: FormGroup;
  isEditMode: boolean = false;
  selectedCajaId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private cajasService: CajasService,
    private sucursalesService: SucursalesService
  ) {
    this.cajaForm = this.fb.group({
      caja: ['', [Validators.required, Validators.maxLength(255)]],
      idSucursal: [null, Validators.required],
      efectivo: [0.00, [Validators.required, Validators.min(0)]],
      idStatus: [1, Validators.required],
      estatus_predeterminado: [1, Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.sucursalesService.getAllSucursales().subscribe({
      next: (sucRes: any) => {
        if (sucRes && sucRes.success) {
          // Filtrar sucursales activas
          this.sucursales = sucRes.data.filter((s: any) => s.estatus === 1);
        }
        
        this.cajasService.getAllCajas().subscribe({
          next: (cajaRes: any) => {
            if (cajaRes && cajaRes.success) {
              this.cajas = cajaRes.data;
            }
            this.loading = false;
          },
          error: (err) => {
            console.error('Error al cargar cajas:', err);
            Swal.fire('Error', 'No se pudieron cargar las cajas.', 'error');
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar sucursales:', err);
        Swal.fire('Error', 'No se pudieron cargar las sucursales.', 'error');
        this.loading = false;
      }
    });
  }

  get cajasFiltradas(): any[] {
    if (!this.searchText.trim()) {
      return this.cajas;
    }
    const text = this.searchText.toLowerCase().trim();
    return this.cajas.filter(c => 
      c.caja.toLowerCase().includes(text) || 
      (c.sucursal && c.sucursal.nombre.toLowerCase().includes(text))
    );
  }

  abrirModalNuevo(): void {
    this.isEditMode = false;
    this.selectedCajaId = null;
    this.cajaForm.reset({
      caja: '',
      idSucursal: null,
      efectivo: 0.00,
      idStatus: 1,
      estatus_predeterminado: 1
    });
    this.cajaForm.get('efectivo')?.enable();

    const modal = new bootstrap.Modal(document.getElementById('cajaAdminModal'));
    modal.show();
  }

  abrirModalEditar(caja: any): void {
    this.isEditMode = true;
    this.selectedCajaId = caja.id;
    this.cajaForm.patchValue({
      caja: caja.caja,
      idSucursal: caja.idSucursal,
      efectivo: caja.efectivo,
      idStatus: caja.idStatus,
      estatus_predeterminado: caja.estatus_predeterminado || 1
    });
    // Deshabilitar efectivo para edición ya que el backend no lo actualiza por seguridad
    this.cajaForm.get('efectivo')?.disable();

    const modal = new bootstrap.Modal(document.getElementById('cajaAdminModal'));
    modal.show();
  }

  guardarCaja(): void {
    if (this.cajaForm.invalid) {
      this.cajaForm.markAllAsTouched();
      return;
    }

    const formValue = this.cajaForm.getRawValue();

    const payload: any = {
      caja: formValue.caja,
      idSucursal: parseInt(formValue.idSucursal, 10),
      estatus_predeterminado: parseInt(formValue.estatus_predeterminado, 10)
    };

    if (!this.isEditMode) {
      payload.efectivo = formValue.efectivo ?? 0.00;
    } else {
      payload.idStatus = parseInt(formValue.idStatus, 10);
    }

    if (this.isEditMode && this.selectedCajaId) {
      this.cajasService.updateCaja(this.selectedCajaId, payload).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            Swal.fire('Éxito', 'Caja actualizada correctamente.', 'success');
            this.cerrarModal();
            this.cargarDatos();
          } else {
            Swal.fire('Error', res.message || 'No se pudo actualizar la caja.', 'error');
          }
        },
        error: (err) => {
          console.error('Error al actualizar caja:', err);
          Swal.fire('Error', err.error?.message || 'Error al actualizar la caja.', 'error');
        }
      });
    } else {
      this.cajasService.createCaja(payload).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            Swal.fire('Éxito', 'Caja creada correctamente.', 'success');
            this.cerrarModal();
            this.cargarDatos();
          } else {
            Swal.fire('Error', res.message || 'No se pudo crear la caja.', 'error');
          }
        },
        error: (err) => {
          console.error('Error al crear caja:', err);
          Swal.fire('Error', err.error?.message || 'Error al crear la caja.', 'error');
        }
      });
    }
  }

  cerrarModal(): void {
    const modalElement = document.getElementById('cajaAdminModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
      modal.hide();
    }
  }

  toggleEstatusCaja(caja: any): void {
    const nuevoEstado = caja.idStatus === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'activar/dar de alta' : 'dar de baja';

    Swal.fire({
      title: `¿Quieres ${accion} la caja?`,
      text: `La caja "${caja.caja}" cambiará a estado ${nuevoEstado === 1 ? 'activo' : 'inactivo'}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: nuevoEstado === 1 ? '#28a745' : '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        if (nuevoEstado === 0) {
          // Desactivación lógica
          this.cajasService.deleteCaja(caja.id).subscribe({
            next: (res: any) => {
              if (res && res.success) {
                Swal.fire('Éxito', 'La caja ha sido dada de baja.', 'success');
                this.cargarDatos();
              } else {
                Swal.fire('Error', res.message || 'No se pudo dar de baja la caja.', 'error');
              }
            },
            error: (err) => {
              console.error('Error al dar de baja:', err);
              Swal.fire('Error', err.error?.message || 'No se pudo dar de baja la caja debido a sesiones activas.', 'error');
            }
          });
        } else {
          // Reactivación
          const payload = {
            caja: caja.caja,
            idSucursal: caja.idSucursal,
            idStatus: 1
          };
          this.cajasService.updateCaja(caja.id, payload).subscribe({
            next: (res: any) => {
              if (res && res.success) {
                Swal.fire('Éxito', 'La caja ha sido reactivada correctamente.', 'success');
                this.cargarDatos();
              } else {
                Swal.fire('Error', res.message || 'No se pudo reactivar la caja.', 'error');
              }
            },
            error: (err) => {
              console.error('Error al reactivar:', err);
              Swal.fire('Error', err.error?.message || 'Error al reactivar la caja.', 'error');
            }
          });
        }
      }
    });
  }
}
