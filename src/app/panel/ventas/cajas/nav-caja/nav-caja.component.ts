import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CajasService } from '../../../../services/cajas.service';
import CryptoJS from 'crypto-js';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
declare var bootstrap: any;

@Component({
  selector: 'app-nav-caja',
  templateUrl: './nav-caja.component.html',
  styleUrl: './nav-caja.component.css'
})
export class NavCajaComponent {

  cantidadDeposito:number = 0;
  cantidadRetiro:number = 0;

  listaBilletesObj = [
    { valor: 1000, key: 'b1000', label: '$1,000', class: 'bill-1000' },
    { valor: 500, key: 'b500', label: '$500', class: 'bill-500' },
    { valor: 200, key: 'b200', label: '$200', class: 'bill-200' },
    { valor: 100, key: 'b100', label: '$100', class: 'bill-100' },
    { valor: 50, key: 'b50', label: '$50', class: 'bill-50' },
    { valor: 20, key: 'b20', label: '$20', class: 'bill-20' }
  ];
  listaMonedasObj = [
    { valor: 10, key: 'm10', label: '$10', class: 'coin-10' },
    { valor: 5, key: 'm5', label: '$5', class: 'coin-5' },
    { valor: 2, key: 'm2', label: '$2', class: 'coin-2' },
    { valor: 1, key: 'm1', label: '$1', class: 'coin-1' },
    { valor: 0.5, key: 'm05', label: '50¢', class: 'coin-05' }
  ];
  denominaciones: any = {
    b1000: 0, b500: 0, b200: 0, b100: 0, b50: 0, b20: 0,
    m10: 0, m5: 0, m2: 0, m1: 0, m05: 0
  };
  resumenCierre: any = null;
  totalFisico: number = 0;
  diferencia: number = 0;
  notasCierre: string = '';
  retiroCierre: number = 0;
  fondoRestante: number = 0;

  constructor(
    private service: CajasService,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ){

  }

  depositarAlert(){
    Swal.fire({
      title: "Depositar a caja",
      input: "number",
      inputLabel: "Cantidad de deposito",
      showCancelButton: true,
      inputValidator: (value:any) => {
        if(value <= 0){
          Swal.fire({
            icon: "error",
            title: "Ingresar una cantidad permitida",
            showConfirmButton: false,
            timer: 1500
          });
          return;
        }
        this.cantidadDeposito=value;
        this.depositar();
      }
    });
  }

  depositar(){
    const idCaja = CryptoJS.AES.decrypt(localStorage.getItem('idCaja'), environment.secretKey).toString(CryptoJS.enc.Utf8);
    const idUsuario = CryptoJS.AES.decrypt(localStorage.getItem('idUsuario'), environment.secretKey).toString(CryptoJS.enc.Utf8);
    this.service.depositar(idCaja,idUsuario,this.cantidadDeposito).subscribe({
      next: (data: any) => {
        if (data.success) {
          Swal.fire({
            icon: "success",
            title: "Deposito exitoso",
            showConfirmButton: false,
            timer: 1500
          });
        }else{
          Swal.fire({
            icon: "error",
            title: "Error al depositar",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error al depositar",
          showConfirmButton: false,
          timer: 1500
        });
      },
    });
  }

  retirarAlert(){
    Swal.fire({
      title: "Retirar de caja",
      input: "number",
      inputLabel: "Cantidad de retiro",
      showCancelButton: true,
      inputValidator: (value:any) => {
        if(value <= 0){
          Swal.fire({
            icon: "error",
            title: "Ingresar una cantidad permitida",
            showConfirmButton: false,
            timer: 1500
          });
          return;
        }
        this.cantidadRetiro=value;
        this.retirar();
      }
    });
  }

  retirar(){
    if(this.cantidadRetiro <= 0){
      Swal.fire({
        icon: "error",
        title: "Ingresar una cantidad permitida",
        showConfirmButton: false,
        timer: 1500
      });
      return;
    }
    const idCaja = CryptoJS.AES.decrypt(localStorage.getItem('idCaja'), environment.secretKey).toString(CryptoJS.enc.Utf8);
    const idUsuario = CryptoJS.AES.decrypt(localStorage.getItem('idUsuario'), environment.secretKey).toString(CryptoJS.enc.Utf8);
    this.service.retirar(idCaja,idUsuario,this.cantidadRetiro).subscribe({
      next: (data: any) => {
        if (data.success) {
          Swal.fire({
            icon: "success",
            title: "Retiro exitoso",
            showConfirmButton: false,
            timer: 1500
          });
        }else{
          if(data.saldoInsuficiente){
            Swal.fire({
              icon: "error",
              title: "Saldo insuficiente, revise la cantidad a retirar",
              showConfirmButton: false,
              timer: 1500
            });
          }else{
            Swal.fire({
              icon: "error",
              title: "Error al retirar",
              showConfirmButton: false,
              timer: 1500
            });
          }
        }
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error al retirar",
          showConfirmButton: false,
          timer: 1500
        });
      },
    });
  }

  alertCerrarSesion() {
    const idCajaDecrypted = CryptoJS.AES.decrypt(localStorage.getItem('idCaja') || '', environment.secretKey).toString(CryptoJS.enc.Utf8);
    const idCaja = parseInt(idCajaDecrypted);

    if (!idCaja) {
      Swal.fire('Error', 'No hay una caja activa en esta sesión.', 'error');
      return;
    }

    this.service.getResumenCierre(idCaja).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.resumenCierre = res.data;
          
          // Resetear calculadora
          this.denominaciones = {
            b1000: 0, b500: 0, b200: 0, b100: 0, b50: 0, b20: 0,
            m10: 0, m5: 0, m2: 0, m1: 0, m05: 0
          };
          this.totalFisico = 0;
          this.diferencia = -this.resumenCierre.efectivo_sistema;
          this.notasCierre = '';
          this.retiroCierre = 0;
          this.fondoRestante = 0;

          // Mostrar modal de Bootstrap
          const modalElement = document.getElementById('arqueoModal');
          if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
          }
        } else {
          Swal.fire('Error', res.message || 'No se pudo obtener el resumen de cierre.', 'error');
        }
      },
      error: (err) => {
        console.error('Error al obtener resumen de cierre:', err);
        const msg = err.error?.message || 'Error al comunicarse con el servidor.';
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  actualizarTotalFisico() {
    const getVal = (v: any) => v && v > 0 ? Number(v) : 0;
    
    const bills = 
      getVal(this.denominaciones.b1000) * 1000 +
      getVal(this.denominaciones.b500) * 500 +
      getVal(this.denominaciones.b200) * 200 +
      getVal(this.denominaciones.b100) * 100 +
      getVal(this.denominaciones.b50) * 50 +
      getVal(this.denominaciones.b20) * 20;

    const coins =
      getVal(this.denominaciones.m10) * 10 +
      getVal(this.denominaciones.m5) * 5 +
      getVal(this.denominaciones.m2) * 2 +
      getVal(this.denominaciones.m1) * 1 +
      getVal(this.denominaciones.m05) * 0.5;

    this.totalFisico = bills + coins;
    if (this.resumenCierre) {
      this.diferencia = this.totalFisico - this.resumenCierre.efectivo_sistema;
    }
    this.actualizarFondoRestante();
  }

  actualizarFondoRestante() {
    const val = (v: any) => v && v > 0 ? Number(v) : 0;
    this.fondoRestante = this.totalFisico - val(this.retiroCierre);
  }

  confirmarCierre() {
    const idCajaDecrypted = CryptoJS.AES.decrypt(localStorage.getItem('idCaja') || '', environment.secretKey).toString(CryptoJS.enc.Utf8);
    const idCaja = parseInt(idCajaDecrypted);

    if (!idCaja) {
      Swal.fire('Error', 'No hay una caja activa en esta sesión.', 'error');
      return;
    }

    const val = (v: any) => v && v > 0 ? Number(v) : 0;
    const numRetiro = val(this.retiroCierre);
    if (numRetiro < 0) {
      Swal.fire('Error', 'El monto a retirar no puede ser menor a 0.', 'error');
      return;
    }
    if (numRetiro > this.totalFisico) {
      Swal.fire('Error', 'El monto a retirar no puede ser mayor al total físico contado.', 'error');
      return;
    }

    const desgloseGuardar = {
      billetes: {
        '1000': this.denominaciones.b1000 || 0,
        '500': this.denominaciones.b500 || 0,
        '200': this.denominaciones.b200 || 0,
        '100': this.denominaciones.b100 || 0,
        '50': this.denominaciones.b50 || 0,
        '20': this.denominaciones.b20 || 0
      },
      monedas: {
        '10': this.denominaciones.m10 || 0,
        '5': this.denominaciones.m5 || 0,
        '2': this.denominaciones.m2 || 0,
        '1': this.denominaciones.m1 || 0,
        '0.5': this.denominaciones.m05 || 0
      }
    };

    this.service.cerrarSesion(idCaja, this.totalFisico, desgloseGuardar, this.notasCierre, numRetiro).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          const closeBtn = document.getElementById('closeArqueoModalBtn');
          closeBtn?.click();

          localStorage.removeItem('idCaja');
          localStorage.removeItem('caja');

          Swal.fire({
            icon: 'success',
            title: 'Sesión Cerrada y Arqueada',
            text: `La sesión de caja ha sido cerrada con un total físico de $${this.totalFisico.toFixed(2)}.`,
            confirmButtonText: 'Entendido'
          }).then(() => {
            let roleId = 0;
            const encryptedIdTipo = localStorage.getItem('idTipo') || '';
            if (encryptedIdTipo) {
              try {
                roleId = parseInt(CryptoJS.AES.decrypt(encryptedIdTipo, environment.secretKey).toString(CryptoJS.enc.Utf8));
              } catch (e) {
                console.error('Error decrypting role in nav-caja:', e);
              }
            }

            if (roleId === 3) {
              window.location.reload();
            } else {
              this.router.navigate(['panel']);
            }
          });
        } else {
          Swal.fire('Error', res.message || 'Error al guardar el arqueo de caja.', 'error');
        }
      },
      error: (err) => {
        console.error('Error al cerrar sesión:', err);
        const msg = err.error?.message || 'Error al procesar el cierre en el servidor.';
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  incrementarDenominacion(key: string): void {
    if (this.denominaciones[key] === undefined) {
      this.denominaciones[key] = 0;
    }
    this.denominaciones[key]++;
    this.actualizarTotalFisico();
  }

  decrementarDenominacion(key: string, event: Event): void {
    event.stopPropagation();
    if (this.denominaciones[key] > 0) {
      this.denominaciones[key]--;
      this.actualizarTotalFisico();
    }
  }

  limpiarCalculadora(): void {
    this.denominaciones = {
      b1000: 0, b500: 0, b200: 0, b100: 0, b50: 0, b20: 0,
      m10: 0, m5: 0, m2: 0, m1: 0, m05: 0
    };
    this.totalFisico = 0;
    if (this.resumenCierre) {
      this.diferencia = -this.resumenCierre.efectivo_sistema;
    }
  }

  logoutConfirm(): void {
    Swal.fire({
      title: '¿Cerrar sesión de usuario?',
      text: 'Se cerrará tu sesión actual en el sistema.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.logout();
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.clearSessionAndRedirect();
      },
      error: (err) => {
        console.error('Error al cerrar sesión en servidor:', err);
        this.clearSessionAndRedirect();
      }
    });
  }

  private clearSessionAndRedirect(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('idUsuario');
      localStorage.removeItem('idTipo');
      localStorage.removeItem('idSucursal');
      localStorage.removeItem('sucursal');
      localStorage.removeItem('manejaIva');
      localStorage.removeItem('idCaja');
      localStorage.removeItem('caja');
    }
    this.router.navigate(['/login']);
  }

}
