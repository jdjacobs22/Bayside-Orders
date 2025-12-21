| Prisma Field  | Prisma Type | Label | ShadeCN or HTML Type |
|  ------------ | ----------- | ----- | -------------------- |
| id        | Int      @id @default(autoincrement()) @map("orden_numero") | | none |
| createdAt | DateTime @default(now()) | | none |
| nombre          | String  | Nombre | Input |
| cell            | String | Cell | Input |
| fechaEmbarque | DateTime @map("fecha_embarque") | Fecha de Embarque | Date Picker |
| horaEmbarque     | String   @map("hora_embarque") | | Hora de Embarque | input type='time' step='1800' |
| 
| destino         | String | Destino | Input |
| puntoEncuentro  | String   @map("punto_encuentro") | Punto de Encuentro | Input |
| pasajeros       | Int | |No. de pasajeros | Input |
| detallesNotas   | String?  @map("detalles_notas") | Notas | Textarea |
|  **CAPITANA** | | | |
| horaLlagado | DateTime @map("hora_llegado") || Hora de Llegado | input type='time' step='1800' |
| combustible     | Int   @default(0) | | Combustible | Input |
| hielo           | Int?   @default(0) | | Hielo | Input |
| aguaBebidas     | Int?   @default(0) @map("agua_bebidas") | Bebidas | Input |
| gastoVarios     | Int?   @default(0) @map("gasto_varios") | | Varios Input |
| **ADMIN** | | | |
| pagoCapitana    | Int    @default(0) @map("pago_capitana") | Pago de Capitana | Input|
| pagoMarinero    | Int    @default(0) @map("pago_marinero") | Pago de Marinero | Input|
| precioAcordado  | Int    @default(0) @map("precio_acordado") |  Precio Acordado | Input| 
| horasAcordadas  | Int    @default(0) @map("horas_acordadas") | Duración Acordado| Input|
| tarifaHora | Int @default(0) @map("tarifa_hora") | Tarifa por Hora | Input |
| cargoExtra | Int  @default(0) @map("cargo_extra") | Cargo Extra | Input |
| costoTotal      | Int?     @default(0) @map("costo_total") | Costo Total | Input|
| deposito        | Int?     @default(0) | Deposito | Input|
| saldoCliente    | Int     @default(0) @map("saldo_cliente")  | Saldo Cliente |Input|
| receipts        | Receipt[]id        Int      @id @default(autoincrement()) @map("orden_numero") | | none |
  

 


 

  
  
 
 

  
  
 