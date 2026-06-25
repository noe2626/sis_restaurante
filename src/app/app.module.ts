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
import { MatSortModule } from '@angular/material/sort';
import { AperturaComponent } from './panel/ventas/cajas/apertura/apertura.component';
import { NavCajaComponent } from './panel/ventas/cajas/nav-caja/nav-caja.component';
import { ProveedoresComponent } from './panel/compras/proveedores/proveedores.component';
import { ComprasComponent } from './panel/compras/compras/compras.component';
import { EditarCompraComponent } from './panel/compras/compras/editar-compra/editar-compra.component';
import { VentasListaComponent } from './panel/ventas/ventas-lista/ventas-lista.component';
import { NuevaVentaComponent } from './panel/ventas/nueva-venta/nueva-venta.component';
import { ClientesComponent } from './panel/clientes/clientes.component';
import { PromocionesComponent } from './panel/promociones/promociones.component';
import { DashboardComponent } from './panel/dashboard/dashboard.component';
import { UsuariosComponent } from './panel/usuarios/usuarios.component';
import { SucursalesAdminComponent } from './panel/sucursales/sucursales.component';
import { CajasAdminComponent } from './panel/cajas/cajas.component';
import { SesionesCajaComponent } from './panel/sesiones-caja/sesiones-caja.component';
import { PreciosClienteComponent } from './panel/precios-cliente/precios-cliente.component';
import { CanalesVentaComponent } from './panel/canales-venta/canales-venta.component';
import { ReportesComponent } from './panel/reportes/reportes.component';
import { MermasComponent } from './panel/inventarios/mermas/mermas.component';
import { FabricacionesComponent } from './panel/inventarios/fabricaciones/fabricaciones.component';
import { A11yModule } from "@angular/cdk/a11y";

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    InicioComponent,
    NavBarComponent,
    VentasComponent,
    ProductosComponent,
    SucursalesComponent,
    InventariosComponent,
    AperturaComponent,
    NavCajaComponent,
    ProveedoresComponent,
    ComprasComponent,
    EditarCompraComponent,
    VentasListaComponent,
    NuevaVentaComponent,
    ClientesComponent,
    PromocionesComponent,
    DashboardComponent,
    UsuariosComponent,
    SucursalesAdminComponent,
    CajasAdminComponent,
    SesionesCajaComponent,
    PreciosClienteComponent,
    CanalesVentaComponent,
    ReportesComponent,
    MermasComponent,
    FabricacionesComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    NgSelectModule,
    FormsModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatTableModule,
    MatSortModule,
    A11yModule
],
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch()),
    provideAnimations()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
