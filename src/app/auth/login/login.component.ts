import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { error } from 'console';
import CryptoJS from 'crypto-js'
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup ;
  errorMessage: string = '';

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
    this.authService.login(this.loginForm.value).subscribe({
      next: (data:any) => {
        if (data.success) {
          const encryptedIdUsuario = CryptoJS.AES.encrypt(data.data.id.toString(), environment.secretKey).toString();
          localStorage.setItem('userToken',data.data.token);
          localStorage.setItem('idUsuario',encryptedIdUsuario);
          this.router.navigate(['sucursales'])
        }
      },
      error: () => { alert("Error al inicar sesión inetente mas tarde") },
    });
  }

}
