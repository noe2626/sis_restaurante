import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import CryptoJS from 'crypto-js';
import { environment } from '../../environments/environment';
import Swal from 'sweetalert2';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const encryptedIdTipo = localStorage.getItem('idTipo');
    if (encryptedIdTipo) {
      try {
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedIdTipo, environment.secretKey);
        const roleId = parseInt(decryptedBytes.toString(CryptoJS.enc.Utf8));
        const allowedRoles = route.data?.['roles'] as Array<number>;

        if (allowedRoles && allowedRoles.includes(roleId)) {
          return true;
        }

        // Acceso Denegado
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: 'No tienes permisos para acceder a esta sección.',
          confirmButtonColor: '#0d6efd',
          timer: 3000,
          timerProgressBar: true
        });

        // Redirigir según el rol
        if (roleId === 3) {
          router.navigate(['/ventas']);
        } else {
          router.navigate(['/panel/dashboard']);
        }
        return false;

      } catch (e) {
        console.error('Error decrypting role in guard:', e);
      }
    }

  router.navigate(['/login']);
  return false;
};
