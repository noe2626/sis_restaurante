import { Component, OnInit } from '@angular/core';
import { CajasService } from '../../services/cajas.service';
import Swal from 'sweetalert2';
import CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sesiones-caja',
  templateUrl: './sesiones-caja.component.html',
  styleUrls: ['./sesiones-caja.component.css']
})
export class SesionesCajaComponent implements OnInit {
  cajas: any[] = [];
  loading: boolean = true;
  searchText: string = '';
  roleId: number = 0;
  filterStatus: string = 'todas'; // 'todas', 'abiertas', 'cerradas'

  constructor(
    private cajasService: CajasService
  ) { }

  ngOnInit(): void {
    const encryptedIdTipo = localStorage.getItem('idTipo') || '';
    if (encryptedIdTipo) {
      try {
        this.roleId = parseInt(CryptoJS.AES.decrypt(encryptedIdTipo, environment.secretKey).toString(CryptoJS.enc.Utf8));
      } catch (e) {
        console.error('Error decrypting role in sesiones-caja:', e);
      }
    }
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
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
  }

  get cajasFiltradas(): any[] {
    let list = this.cajas;
    
    // Filtro por estado de sesión
    if (this.filterStatus === 'abiertas') {
      list = list.filter(c => c.active_session);
    } else if (this.filterStatus === 'cerradas') {
      list = list.filter(c => !c.active_session);
    }

    if (!this.searchText.trim()) {
      return list;
    }

    const text = this.searchText.toLowerCase().trim();
    return list.filter(c => 
      c.caja.toLowerCase().includes(text) || 
      (c.sucursal && c.sucursal.nombre.toLowerCase().includes(text)) ||
      (c.active_session && c.active_session.user && c.active_session.user.name.toLowerCase().includes(text))
    );
  }

  cerrarSesionForzado(caja: any): void {
    if (!caja.active_session) {
      Swal.fire('Info', 'Esta caja no tiene una sesión abierta.', 'info');
      return;
    }

    const cajeroNombre = caja.active_session.user ? caja.active_session.user.name : 'Cajero';

    this.cajasService.getResumenCierre(caja.id).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          const resumen = res.data;
          const efectivoSistema = resumen.efectivo_sistema;

          Swal.fire({
            title: `Cerrar Sesión Activa - ${caja.caja}`,
            html: `
              <div class="text-start fs-7 text-dark">
                <div class="mb-1"><strong>Cajero:</strong> ${cajeroNombre}</div>
                <div class="mb-1"><strong>Apertura:</strong> ${new Date(resumen.fecha_apertura).toLocaleString()}</div>
                <div class="mb-3"><strong>Efectivo en Sistema:</strong> <span class="text-success fw-bold">${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(efectivoSistema)}</span></div>
                
                <hr class="my-2">
                
                <div class="mb-2">
                  <label class="form-label fw-semibold mb-1">Efectivo Físico Real al Cierre</label>
                  <input type="number" id="swal-cantidad-cierre" class="form-control form-control-sm" value="${efectivoSistema}" step="0.01" min="0">
                </div>
                
                <div class="mb-2">
                  <label class="form-label fw-semibold mb-1">Retiro de Efectivo al Cierre</label>
                  <input type="number" id="swal-retiro-cierre" class="form-control form-control-sm" value="0.00" step="0.01" min="0">
                </div>

                <div class="mb-2">
                  <label class="form-label fw-semibold mb-1">Notas / Motivo de Cierre</label>
                  <textarea id="swal-notas" class="form-control form-control-sm" rows="2" placeholder="Ej. Cierre de sesión por inactividad o fin de turno."></textarea>
                </div>
              </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Cerrar Caja',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545',
            preConfirm: () => {
              const cantidadCierreVal = (document.getElementById('swal-cantidad-cierre') as HTMLInputElement).value;
              const retiroCierreVal = (document.getElementById('swal-retiro-cierre') as HTMLInputElement).value;
              const notasVal = (document.getElementById('swal-notas') as HTMLTextAreaElement).value;

              if (cantidadCierreVal === '' || parseFloat(cantidadCierreVal) < 0) {
                Swal.showValidationMessage('El efectivo físico real no puede ser menor a 0.');
                return false;
              }
              if (retiroCierreVal === '' || parseFloat(retiroCierreVal) < 0) {
                Swal.showValidationMessage('El retiro no puede ser menor a 0.');
                return false;
              }

              return {
                cantidad_cierre: parseFloat(cantidadCierreVal),
                retiro_cierre: parseFloat(retiroCierreVal),
                notes: notasVal || 'Cierre forzado de sesión por Administrador/Supervisor'
              };
            }
          }).then((result) => {
            if (result.isConfirmed) {
              const data = result.value;
              this.loading = true;
              this.cajasService.cerrarSesion(caja.id, data.cantidad_cierre, null, data.notes, data.retiro_cierre).subscribe({
                next: (closeRes: any) => {
                  this.loading = false;
                  if (closeRes && closeRes.success) {
                    Swal.fire('Éxito', 'La sesión de caja ha sido cerrada correctamente.', 'success');
                    this.cargarDatos();
                  } else {
                    Swal.fire('Error', closeRes.message || 'No se pudo cerrar la sesión de caja.', 'error');
                  }
                },
                error: (err: any) => {
                  this.loading = false;
                  console.error('Error al cerrar sesión forzada:', err);
                  Swal.fire('Error', err.error?.message || 'Error del servidor al intentar cerrar la caja.', 'error');
                }
              });
            }
          });

        } else {
          Swal.fire('Error', res.message || 'No se pudo obtener el resumen de cierre de la caja.', 'error');
        }
      },
      error: (err: any) => {
        console.error('Error al obtener resumen de cierre:', err);
        Swal.fire('Error', 'No se pudo conectar con el servidor para obtener los datos de la sesión.', 'error');
      }
    });
  }
}
