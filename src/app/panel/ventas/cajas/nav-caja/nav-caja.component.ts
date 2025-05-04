import { Component } from '@angular/core';
import { CajasService } from '../../../../services/cajas.service';
import CryptoJS from 'crypto-js';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
declare var bootstrap: any;

@Component({
  selector: 'app-nav-caja',
  templateUrl: './nav-caja.component.html',
  styleUrl: './nav-caja.component.css'
})
export class NavCajaComponent {

  cantidadDeposito:number = 0;
  cantidadRetiro:number = 0;

  constructor(private service:CajasService,
    private router: Router
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

  alertCerrarSesion(){
    Swal.fire({
      title: 'Cerrar sesión',
      showDenyButton: true,
      confirmButtonText: 'Confirmar',
      denyButtonText: 'Cancelar',
      customClass: {
        actions: 'my-actions',
        cancelButton: 'order-1 right-gap',
        confirmButton: 'order-2',
        denyButton: 'order-3',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.cerrarSesion();
      }
    })
  }

  cerrarSesion(){
    const idCaja = CryptoJS.AES.decrypt(localStorage.getItem('idCaja'), environment.secretKey).toString(CryptoJS.enc.Utf8);
    this.service.cerrarSesion(idCaja).subscribe({
      next: (data: any) => {
        if (data.success) {
          localStorage.removeItem('idCaja');
          Swal.fire({
            icon: "success",
            title: "Sesión cerrada exitosamente",
            showConfirmButton: false,
            timer: 1500
          });
          this.router.navigate(['panel']);
        }else{
          Swal.fire({
            icon: "error",
            title: "Error al cerrar sesión",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error al cerrar sesión",
          showConfirmButton: false,
          timer: 1500
        });
      },
    });
  }

}
