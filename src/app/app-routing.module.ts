import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { InicioComponent } from './panel/inicio/inicio.component';
import { VentasComponent } from './panel/ventas/ventas.component';
import { ProductosComponent } from './panel/inventarios/productos/productos.component';

const routes: Routes = [
  {path: '',component: LoginComponent},
  {path: 'login',component: LoginComponent},
  {path: 'panel',component: InicioComponent,
    children: [
      { path: 'ventas', component: VentasComponent },
      { path: 'productos', component: ProductosComponent},
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
