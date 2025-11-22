window.app = (function(){
    const state = {
        insumos: [],
        productos: [],
        carrito: [], 
        reporte: {
            resumen: {},
            productos_vendidos: [],
            consumo_insumos: []
        },
        currentView: 'insumos'
    };
    let chartInstance = null;
    const APP_CONTENT = document.getElementById('app-content');

    //UTILIDADES DE CONEXION A LA API

    /**
     * Realiza una petición fetch a la API de PHP.
     * @param {string} url - URL del endpoint (ej: 'api/insumos.php')
     * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
     * @param {object} [data=null] - Cuerpo de la petición para POST/PUT
     * @returns {Promise<object>} - El objeto de respuesta JSON del servidor
     */
    async function apiFetch(url, method = 'GET', data = null){
        const options = {
            method: method,
            headers:{
                'Content-Type': 'application/json',
            }
        };

        if (data){
            if (method === 'POST'){
                options.body = JSON.stringify(data);
            }else if (method === 'PUT' || method === 'DELETE'){
                options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                const urlEncodedData = new URLSearchParams(data).toString();
                options.body = urlEncodedData;
            }
        }
        try {
            const response = await fetch(url, options);
            let json;
            try {
                json = await response.json();
            } catch (e){
                // Si falla la decodificacion del json
                throw new Error(`Respuesta no válida de la API. Código HTTP: ${response.status}. (Posiblemente un error o advertencia de PHP antes del JSON)`);
            }
            if (!response.ok || !json.success){
                throw new Error(json.message || `Error en la API. Código HTTP: ${response.status}`);
            }
            return json;
        } catch (error){
            console.error("Error en apiFetch:", error);
            // Muestra el error capturado
            showMessage('Error de API', error.message || 'Ocurrió un error al comunicarse con el servidor.', 'error');
            throw error;
        }
    }


    // INTERFAZ


    function showMessage(title, text, type = 'success'){
        const modal = document.getElementById('message-box');
        document.getElementById('message-title').textContent = title;
        document.getElementById('message-text').textContent = text;
        // Estilos
        const content = document.getElementById('message-content');
        content.classList.remove('modal-success', 'modal-error', 'modal-info');
        content.classList.add(`modal-${type}`);
        modal.classList.add('active');
    }
    function hideMessage(){
        document.getElementById('message-box').classList.remove('active');
    }
    function changeView(newView){
        state.currentView = newView;
        // Quita 'active' de todos
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        // Pone 'active' al boton de la vista actual
        document.querySelector(`.tab-button[data-view="${newView}"]`).classList.add('active');

        // Renderiza la vista
        switch (newView){
            case 'insumos':
                renderInsumosView();
                break;
            case 'productos':
                renderProductosView();
                break;
            case 'pos':
                renderPosView();
                break;
            case 'reporte':
                renderReporteView();
                break;
        }
    }

    //FUNCIONES DE CARGA DE DATOS --- Importante xd ---

    async function loadInsumos(){
        try {
            const response = await apiFetch('api/insumos.php', 'GET');
            state.insumos = response.data;
            console.log(response.data)
            if (state.currentView === 'insumos'){
                renderInsumosView();
            }
        } catch (e){
            console.warn("No se pudieron cargar los insumos.");
        }
    }

    async function loadProductos(){
        try {
            const response = await apiFetch('api/productos.php', 'GET');
            state.productos = response.data;
            // Solo renderiza si esta en una vista que lo necesite inmediatamente
            if (state.currentView === 'productos'){
                 renderProductosView();
            }else if (state.currentView === 'pos'){
                renderPosView();
            }
        } catch (e){
            console.warn("No se pudieron cargar los productos.");
        }
    }

    async function loadReporteDiario(){
        try {
            const response = await apiFetch('api/reporte_diario.php', 'GET');
            state.reporte = response;
            if (state.currentView === 'reporte'){
                renderReporteView();
            }
        } catch (e){
            console.warn("No se pudo cargar el reporte diario.");
        }
    }

    // LOGICA Y CONEXION A LA API 

    // insumos

    async function addInsumo(nombre, unidad_medida, stock_actual, costo_por_unidad){
        const data = { nombre, unidad_medida, stock_actual, costo_por_unidad };
        await apiFetch('api/insumos.php', 'POST', data);
        showMessage('Éxito', 'Insumo agregado con éxito.', 'success');
        await loadInsumos();
    }

    async function updateInsumoStock(id_insumo, new_stock){
        const data = { id_insumo: id_insumo, stock_actual: new_stock };
        await apiFetch('api/insumos.php', 'PUT', data);
        showMessage('Éxito', 'Stock actualizado con éxito.', 'success');
        await loadInsumos();
    }

    async function deleteInsumo(id_insumo){
        const data = { id_insumo: id_insumo };
        await apiFetch('api/insumos.php', 'DELETE', data);
        showMessage('Éxito', 'Insumo eliminado con éxito.', 'success');
        await loadInsumos();
    }

    // productos

    async function addProducto(nombre_producto, precio_venta, receta){
        const data = { nombre_producto, precio_venta, receta };
        await apiFetch('api/productos.php', 'POST', data);
        showMessage('Éxito', 'Producto y receta guardados con éxito.', 'success');
        await loadProductos();
    }

    // ventas
    async function registrarVenta(productos_vendidos, total){
        // CAMBIAR EL ID DE USUARIO DE ACUERDO A LA BDD PENDIENTE XD ------------------
        const id_usuario = 1;
        const data = {
            productos: productos_vendidos,
            total: total,
            id_usuario: id_usuario
        };
        await apiFetch('api/ventas.php', 'POST', data);
        showMessage('Venta Exitosa', 'Venta registrada e inventario deducido.', 'success');

        // crucial recargar insumos y reporte despue de una venta
        await loadInsumos();
        await loadReporteDiario();

        // Limpiar el carrito
        state.carrito = [];
        renderPosView();
    }

    // MANEJADORES DE EVENTOS Y FORMULARIOS

    // handlers de insumos

    async function handleNewInsumoSubmit(event){
        event.preventDefault();
        const form = event.target;
        const nombre = form.querySelector('[name="nombre"]').value.trim();
        const unidad_medida = form.querySelector('[name="unidad_medida"]').value.trim();
        const stock_actual = parseFloat(form.querySelector('[name="stock_actual"]').value);
        const costo_por_unidad = parseFloat(form.querySelector('[name="costo_por_unidad"]').value);

        if (!nombre || !unidad_medida || isNaN(stock_actual) || isNaN(costo_por_unidad)){
            return showMessage('Error de Validación', 'Por favor, complete todos los campos correctamente.', 'error');
        }

        try {
            await addInsumo(nombre, unidad_medida, stock_actual, costo_por_unidad);
            form.reset();
        } catch (e){
            // El error se maneja en apiFetch
        }
    }

    function handleStockUpdateClick(id_insumo){
        const insumo = state.insumos.find(i => i.id_insumo == id_insumo);
        if (!insumo) return showMessage('Error', 'Insumo no encontrado.', 'error');
        const newStock = prompt(`Ingrese nuevo stock para ${insumo.nombre} (Unidad: ${insumo.unidad_medida}). Stock actual: ${insumo.stock_actual}`);
        if (newStock !== null && !isNaN(parseFloat(newStock))){
            updateInsumoStock(id_insumo, parseFloat(newStock));
        }else if (newStock !== null){
            showMessage('Advertencia', 'El valor ingresado no es un número válido.', 'warning');
        }
    }
    function handleDeleteInsumoClick(id_insumo){
        const insumo = state.insumos.find(i => i.id_insumo == id_insumo);
        if (!insumo) return;

        if (confirm(`¿Está seguro de eliminar el insumo: ${insumo.nombre}? Esta acción no se puede deshacer.`)){
            deleteInsumo(id_insumo);
        }
    }


    // handlers de los productos y recetas
    
    // Función auxiliar para agregar/remover campos de receta
    function addRecetaInput(idProducto){
        const container = document.getElementById(`receta-container-${idProducto || 'nuevo'}`);
        if (!container) return;
        const index = container.children.length;
        const insumosOptions = state.insumos.map(i => 
            `<option value="${i.id_insumo}">${i.nombre} (${i.unidad_medida})</option>`
        ).join('');
        const newRow = document.createElement('div');
        newRow.classList.add('receta-row');
        newRow.innerHTML = `
            <select name="receta[${index}][id_insumo]" required>
                <option value="">-- Seleccionar Insumo --</option>
                ${insumosOptions}
            </select>
            <input type="number" step="0.01" name="receta[${index}][cantidad_requerida]" placeholder="Cantidad" required>
            <button type="button" class="btn btn-danger btn-sm" onclick="window.app.removeRecetaInput(this)">X</button>
        `;
        container.appendChild(newRow);
    }
    function removeRecetaInput(button){
        button.closest('.receta-row').remove();
    }
    async function handleNewProductoSubmit(event){
        event.preventDefault();
        const form = event.target;
        const nombre_producto = form.querySelector('[name="nombre_producto"]').value.trim();
        const precio_venta = parseFloat(form.querySelector('[name="precio_venta"]').value);
        
        // Recoleccion dinamica de la receta
        const recetaInputs = form.querySelectorAll('.receta-row');
        const receta = [];
        recetaInputs.forEach(row => {
            const id_insumo = row.querySelector('select').value;
            const cantidad_requerida = parseFloat(row.querySelector('input').value);

            if (id_insumo && !isNaN(cantidad_requerida) && cantidad_requerida > 0){
                receta.push({
                    id_insumo: parseInt(id_insumo),
                    cantidad_requerida: cantidad_requerida
                });
            }
        });
        if (!nombre_producto || isNaN(precio_venta) || precio_venta <= 0){
            return showMessage('Error de Validación', 'Nombre y Precio de Venta son obligatorios.', 'error');
        }
        try {
            await addProducto(nombre_producto, precio_venta, receta);
            form.reset();
            // Limpia los campos de receta
            document.getElementById('receta-container-nuevo').innerHTML = '';
        } catch (e){
            // El error se maneja en apiFetch
        }
    }
    
    // handlers punto de venta c:

    function addItemToTicket(id_producto){
        const producto = state.productos.find(p => p.id_producto == id_producto);
        if (!producto) return;
        const existingItem = state.carrito.find(item => item.id_producto === id_producto);
        if (existingItem){
            existingItem.cantidad += 1;
        }else {
            state.carrito.push({
                id_producto: producto.id_producto,
                nombre_producto: producto.nombre_producto,
                precio_venta: parseFloat(producto.precio_venta),
                cantidad: 1
            });
        }
        renderPosView();
    }
    function updateTicketItemQuantity(id_producto, newQuantity){
        const item = state.carrito.find(item => item.id_producto === id_producto);
        if (item){
            item.cantidad = newQuantity;
            if (item.cantidad <= 0){
                removeItemFromTicket(id_producto);
            }
        }
        renderPosView();
    }
    function removeItemFromTicket(id_producto){
        state.carrito = state.carrito.filter(item => item.id_producto !== id_producto);
        renderPosView();
    }
    async function handleProcessSale(){
        if (state.carrito.length === 0){
            return showMessage('Advertencia', 'El carrito de ventas está vacío.', 'warning');
        }

        const total = state.carrito.reduce((sum, item) => sum + (item.precio_venta * item.cantidad), 0);
        
        // Solo enviar los datos requeridos por la API
        const productos_vendidos = state.carrito.map(item => ({
            id_producto: item.id_producto,
            cantidad: item.cantidad
        }));

        try {
            await registrarVenta(productos_vendidos, total);
        }catch(e){}
    }
    function clearTicket(){
        if (confirm('¿Desea limpiar el carrito de ventas?')){
            state.carrito = [];
            renderPosView();
        }
    }

    // Vistas y listeners

    function renderInsumosView(){
        const insumosHtml = `
            <h2>Gestión de Insumos</h2>
            
            <div class="card p-4 mb-4">
                <h3>Agregar Nuevo Insumo</h3>
                <form id="form-nuevo-insumo" class="form-grid">
                    <input type="text" name="nombre" placeholder="Nombre del Insumo" required>
                    <input type="text" name="unidad_medida" placeholder="Unidad (kg, lt, pza)" required>
                    <input type="number" step="0.01" name="stock_actual" placeholder="Stock Inicial" required>
                    <input type="number" step="0.01" name="costo_por_unidad" placeholder="Costo por Unidad" required>
                    <button type="submit" class="btn btn-primary">Guardar Insumo</button>
                </form>
            </div>

            <h3>Inventario Actual</h3>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Unidad</th>
                            <th>Stock</th>
                            <th>Costo Unitario</th>
                            <th>Costo Total</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.insumos.map(i => `
                            <tr>
                                <td>${i.nombre}</td>
                                <td>${i.unidad_medida}</td>
                                <td>${parseFloat(i.stock_actual).toFixed(2)}</td>
                                <td>$${parseFloat(i.costo_por_unidad).toFixed(2)}</td>
                                <td>$${(i.stock_actual * i.costo_por_unidad).toFixed(2)}</td>
                                <td>
                                    <button class="btn btn-secondary btn-sm" onclick="window.app.handleStockUpdateClick(${i.id_insumo})">Ajustar Stock</button>
                                    <button class="btn btn-danger btn-sm" onclick="window.app.handleDeleteInsumoClick(${i.id_insumo})">Eliminar</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        APP_CONTENT.innerHTML = insumosHtml;
        setupInsumosListeners(); // Llama a la conexion de eventos dinamicos
    }
    function renderProductosView(){
        const productosHtml = `
            <h2>Gestión de Menú y Recetas</h2>
            
            <div class="card p-4 mb-4">
                <h3>Agregar Nuevo Producto</h3>
                <form id="form-nuevo-producto">
                    <div class="form-grid">
                        <input type="text" name="nombre_producto" placeholder="Nombre del Producto (Ej: Taco de Pastor)" required>
                        <input type="number" step="0.01" name="precio_venta" placeholder="Precio de Venta ($)" required>
                        <div></div>
                    </div>
                    
                    <h4>Receta (Insumos Requeridos)</h4>
                    <div id="receta-container-nuevo" class="receta-container">
                        </div>
                    <button type="button" class="btn btn-secondary mb-3" onclick="window.app.addRecetaInput()">+ Añadir Insumo a Receta</button>
                    <button type="submit" class="btn btn-primary btn-block">Guardar Producto</button>
                </form>
            </div>

            <h3>Menú Actual</h3>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Producto</th>
                            <th>Precio Venta</th>
                            <th>Receta (Insumo : Cantidad)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.productos.map(p => `
                            <tr>
                                <td>${p.id_producto}</td>
                                <td>${p.nombre_producto}</td>
                                <td>$${parseFloat(p.precio_venta).toFixed(2)}</td>
                                <td>
                                    <ul>
                                    ${p.receta.map(r => 
                                        `<li>${r.insumo_nombre}: ${parseFloat(r.cantidad_requerida).toFixed(2)} ${r.unidad_medida}</li>`
                                    ).join('')}
                                    </ul>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        APP_CONTENT.innerHTML = productosHtml;
        setupProductosListeners();
    }

    function renderPosView(){
        const totalVenta = state.carrito.reduce((sum, item) => sum + (item.precio_venta * item.cantidad), 0);

        const posHtml = `
            <h2>Punto de Venta</h2>
            <div class="pos-layout">
                <div class="menu-productos">
                    <h3>Productos Disponibles</h3>
                    <div class="product-grid">
                        ${state.productos.map(p => `
                            <button class="product-card" onclick="window.app.addItemToTicket(${p.id_producto})">
                                <span class="product-name">${p.nombre_producto}</span>
                                <span class="product-price">$${parseFloat(p.precio_venta).toFixed(2)}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="ticket-area">
                    <h3>Ticket Actual</h3>
                    <div class="ticket-list">
                        ${state.carrito.map(item => `
                            <div class="ticket-item">
                                <span class="item-name">${item.nombre_producto}</span>
                                <div class="item-controls">
                                    <input type="number" min="1" value="${item.cantidad}" 
                                           onchange="window.app.updateTicketItemQuantity(${item.id_producto}, parseInt(this.value))" 
                                           class="quantity-input">
                                    <span class="item-total">$${(item.precio_venta * item.cantidad).toFixed(2)}</span>
                                    <button class="btn btn-danger btn-sm" onclick="window.app.removeItemFromTicket(${item.id_producto})">X</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="ticket-summary">
                        <p class="total-text">Total: <span>$${totalVenta.toFixed(2)}</span></p>
                    </div>
                    <button class="btn btn-success btn-lg btn-block mt-3" onclick="window.app.handleProcessSale()">
                        Procesar Venta ($${totalVenta.toFixed(2)})
                    </button>
                    <button class="btn btn-secondary btn-block mt-2" onclick="window.app.clearTicket()">Limpiar Ticket</button>
                </div>
            </div>
        `;
        APP_CONTENT.innerHTML = posHtml;
    }

    function renderReporteView(){
        const reporte = state.reporte;
        
        // Funcion para renderizar el chart 
        function setupReporteChart(){
            if (chartInstance){
                chartInstance.destroy();
            }
            const ctx = document.getElementById('productosChart');
            if (!ctx) return;

            const labels = reporte.productos_vendidos.map(p => p.nombre_producto);
            const data = reporte.productos_vendidos.map(p => parseFloat(p.total_vendido));

            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Cantidad Vendida',
                        data: data,
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }
        
        const resumen = reporte.resumen;
        const reporteHtml = `
            <h2>Reporte Diario - ${new Date().toLocaleDateString()}</h2>
            <div class="reporte-summary">
                <div class="card summary-card">
                    <h4>Ventas Totales</h4>
                    <p class="summary-value">$${parseFloat(resumen.total_ventas || 0).toFixed(2)}</p>
                </div>
                <div class="card summary-card">
                    <h4># de Transacciones</h4>
                    <p class="summary-value">${resumen.num_ventas || 0}</p>
                </div>
                <div class="card summary-card">
                    <h4>Total Productos Vendidos</h4>
                    <p class="summary-value">${resumen.total_productos || 0}</p>
                </div>
            </div>

            <div class="reporte-details">
                <div class="card">
                    <h3>Productos Más Vendidos (Cantidad)</h3>
                    <canvas id="productosChart"></canvas>
                </div>
                <div class="card">
                    <h3>Consumo de Insumos (Merma Estimada)</h3>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Insumo</th>
                                    <th>Consumo</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${reporte.consumo_insumos.map(c => `
                                    <tr>
                                        <td>${c.insumo_nombre}</td>
                                        <td>${parseFloat(c.consumo_total).toFixed(2)} ${c.unidad_medida}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        APP_CONTENT.innerHTML = reporteHtml;
        setupReporteChart(); // Llama a la función que dibuja el grafico
    }


    // listeners dinamicos

    // Conectar los listeners del formulario de insumos (se llama dentro de renderInsumosView)
    function setupInsumosListeners(){
        const form = document.getElementById('form-nuevo-insumo');
        if (form){
            form.addEventListener('submit', handleNewInsumoSubmit);
        }
    }
    
    // Conectar los listeners del formulario de productos (se llama dentro de renderProductosView)
    function setupProductosListeners(){
        const form = document.getElementById('form-nuevo-producto');
        if (form){
            form.addEventListener('submit', handleNewProductoSubmit);
        }
    }

    // Conexion de listeners estaticos (Navegacion)
    function setupStaticListeners(){
        // Enlazar botones de navegacion
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                changeView(e.target.getAttribute('data-view'));
            });
        });
    }

    // INICIALIZACION DE LA APLICACIÓN

    async function init(){
        console.log("Inicializando Gestor Taquería...");

        // Conectar listeners de navegación
        setupStaticListeners();

        // Cargar datos iniciales de la base de datos
        try {
            // Cargar todos los datos al inicio para que estén disponibles en todas las vistas
            await loadInsumos();
            await loadProductos();
            await loadReporteDiario();
        } catch (e){
            showMessage('Fallo al Cargar', 'La aplicación no pudo cargar los datos iniciales de la base de datos.', 'error');
        }

        // Establecer la vista inicial
        const initialView = 'insumos';
        changeView(initialView);
    }

    // EXPOSICIÓN DE FUNCIONES PUBLICAS

    // Ejecutar la inicializacion cuando el DOM esta cargado
    document.addEventListener('DOMContentLoaded', init);

    // Funciones publicas expuestas a window.app
    return {
        // Core
        init,
        apiFetch, 
        showMessage,
        hideMessage,
        changeView,
        
        // Carga de Datos
        loadInsumos,
        loadProductos,
        loadReporteDiario,

        // Insumos CRUD
        handleNewInsumoSubmit, // Nuevo Insumo
        handleStockUpdateClick, // Ajustar Stock 
        handleDeleteInsumoClick, // Eliminar Insumo 
        
        // Productos/Recetas CRUD
        handleNewProductoSubmit, // Nuevo Producto
        addRecetaInput,
        removeRecetaInput,

        // Ventas
        addItemToTicket,
        updateTicketItemQuantity,
        removeItemFromTicket,
        handleProcessSale, // Procesar Venta 
        clearTicket,
        
        // Estado
        state // Eliminar xd
    };

})();