import { Component, OnInit } from '@angular/core';
import { CajasService } from '../../../../services/cajas.service';
import Swal from 'sweetalert2';
declare var bootstrap: any;
import CryptoJS from 'crypto-js'
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-apertura',
  templateUrl: './apertura.component.html',
  styleUrl: './apertura.component.css'
})
export class AperturaComponent implements OnInit {

  idCaja: number = 0;
  cajas: any = null;
  efectivoCaja = 0;

  constructor(private cajaService: CajasService) {

  }

  ngOnInit(): void {
    
    let caja = localStorage.getItem('idCaja');
    if (caja) {
      const decryptedIdCaja = CryptoJS.AES.decrypt(localStorage.getItem('idCaja'), environment.secretKey).toString(CryptoJS.enc.Utf8);
      this.idCaja = parseInt(decryptedIdCaja);
    }
    if (caja == null) {
      document.getElementById('btnModalApCajas')?.click();
      this.cajaService.getSucursalesByUsuario().subscribe({
        next: (data: any) => {
          if (data.success) {
            this.cajas = data.data
          }
        },
        error: () => {
          Swal.fire({
            icon: "error",
            title: "Error al consutar cajas",
            showConfirmButton: false,
            timer: 1500
          });
        },
      });
    }
  }

  cambiarCaja() {
    const cajaSeleccionada = this.cajas.find((caja: any) => caja.idCaja == this.idCaja);
    this.efectivoCaja = cajaSeleccionada.efectivo;
  }

  abrirCaja() {
    this.cajaService.abrirCaja(this.efectivoCaja, this.idCaja).subscribe({
      next: (data: any) => {
        if (data.success) {
          const encryptedIdCaja = CryptoJS.AES.encrypt(this.idCaja.toString(), environment.secretKey).toString();
          localStorage.setItem("idCaja", encryptedIdCaja);
          Swal.fire({
            icon: "success",
            title: "Sesión creada",
            showConfirmButton: false,
            timer: 1500
          });
          const modalElement = document.getElementById('aperturaModal'); 
          const modal = bootstrap.Modal.getInstance(modalElement);
          modal.hide();
        }
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error al crear sesión",
          showConfirmButton: false,
          timer: 1500
        });
      },
    });
  }


}
