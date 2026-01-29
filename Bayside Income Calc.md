# **Fields that Both Capitana and Admin Can Edit**

	Hora del Legado

	Combustible

	Hielo

	Bebides

	Varios

	Horas Extra

	Pagar al Embarque

		Efectivo or Transferir

		Pago Recibo

# **Fields that only Admin Can Edit**

	Destino

Punto Encuentro

Fecha de Embarque

Hora de Embarque

Pago Capitana

	Pago Marinero

	Tarifa por Hora

	Duracion Acordada

	Cargo Extra

	Deposito

# **Calculated Fields**

	Precio Acordado \= tarifa por hora \* duration acordada

	Costo Total \= Precio Acordado \+ Cargo Extra \+ (Horas Extra \* Tarifa por Hora)

Saldo Cliente \= Costo Total \- Expenses Total;  where Expenses Total \= Pago Capitana \+ Pago Marinero \+ Combustible \+ Hielo \+ Bebidas \+ Varios

Debido a Bayside \= Saldo Cliente

	

	