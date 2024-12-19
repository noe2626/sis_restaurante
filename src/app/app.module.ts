import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './auth/login/login.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {provideHttpClient, withFetch } from '@angular/common/http';
import { InicioComponent } from './panel/inicio/inicio.component';
import { NavBarComponent } from './panel/nav-bar/nav-bar.component';
import { VentasComponent } from './panel/ventas/ventas.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ProductosComponent } from './panel/inventarios/productos/productos.component';
import { SucursalesComponent } from './auth/sucursales/sucursales.component';
import { InventariosComponent } from './panel/inventarios/inventarios/inventarios.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    InicioComponent,
    NavBarComponent,
    VentasComponent,
    ProductosComponent,
    SucursalesComponent,
    InventariosComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    NgSelectModule,
    FormsModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatTableModule
  ],
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch()),
    provideAnimations()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
