import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import CryptoJS from 'crypto-js'
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup ;
  errorMessage: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
    
  ) {
    this.loginForm = this.fb.group({
      user: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (data:any) => {
        this.loading = false;
        if (data.success) {
          const encryptedIdUsuario = CryptoJS.AES.encrypt(data.data.id.toString(), environment.secretKey).toString();
          const encryptedIdTipo = CryptoJS.AES.encrypt(data.data.idTipo.toString(), environment.secretKey).toString();
          localStorage.setItem('userToken',data.data.token);
          localStorage.setItem('idUsuario',encryptedIdUsuario);
          localStorage.setItem('idTipo', encryptedIdTipo);
          localStorage.setItem('userName', data.data.name || '');
          this.router.navigate(['sucursales'])
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error de Inicio de Sesión',
            text: data.message || 'Usuario o contraseña incorrectos.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#3085d6'
          });
        }
      },
      error: (err: any) => { 
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error de Conexión',
          text: err.error?.message || 'Error al iniciar sesión, intente más tarde.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#3085d6'
        });
      },
    });
  }

}
