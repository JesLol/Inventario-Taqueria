window.app = (function(){
    // Estado Inicial
    const state = {
        insumos: [],
        productos: [],
        carrito: [], 
        usuarios: [],
        reporte: {
            resumen: {},
            productos_vendidos: [],
            consumo_insumos: [],
            ventas_detalladas: []
        },
        currentView: 'insumos'
    };
    
    let chartInstance = null;
    const APP_CONTENT = document.getElementById('app-content');
    
    // Api utilidades
    async function apiFetch(url, method = 'GET', data = null){
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (data){
            if (method === 'POST'){
                options.body = JSON.stringify(data);
            } else if (method === 'PUT' || method === 'DELETE'){
                options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                options.body = new URLSearchParams(data).toString();
            }
        }
        try {
            const response = await fetch(url, options);
            const json = await response.json();
            
            if (!response.ok || !json.success){
                throw new Error(json.message || `Error ${response.status}`);
            }
            return json;
        } catch (error){
            console.error("API Error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error de Conexión',
                text: error.message || 'No se pudo conectar con el servidor.',
                confirmButtonColor: 'var(--primary)'
            });
            throw error;
        }
    }
    async function performLogin(){
        const { value: username } = await Swal.fire({
            title: 'Iniciar sesión',
            text: 'Ingresa tu nombre de usuario',
            input: 'text', 
            inputPlaceholder: 'Nombre de usuario',
            allowOutsideClick: false,
            allowEscapeKey: false,
            confirmButtonText: 'Siguiente',
            confirmButtonColor: 'var(--primary)',
            inputValidator: (value) => {
                if (!value) return 'Necesitas escribir tu nombre de usuario';
            }
        });

        if (!username) {
            return; 
        }
        // pedir la pass
        const { value: password } = await Swal.fire({
            title: `PIN de acceso para: ${username}`,
            text: 'Ingresa tu código de acceso',
            input: 'password',
            inputPlaceholder: 'Código / PIN',
            allowOutsideClick: false,
            allowEscapeKey: false,
            confirmButtonText: 'Entrar',
            confirmButtonColor: 'var(--primary)',
            inputValidator: (value) => {
                if (!value) return 'Necesitas escribir tu código';
            }
        });
        if (!password) {
            performLogin(); 
            return;
        }
        try {
            // Llamada a la api
            const response = await apiFetch('api/login.php', 'POST', { username, password });
            state.currentUser = response.user;
            
            Swal.fire({
                icon: 'success',
                title: `Bienvenido, ${state.currentUser.nombre}`,
                timer: 1500,
                showConfirmButton: false
            });
            applyRolePermissions();
            
            // Cargar datos iniciales
            await Promise.all([loadProductos()]); 
            
            if(state.currentUser.role === 'admin'){
                await loadInsumos();
                await loadReporteDiario();
                changeView('insumos');
            } else {
                changeView('pos');
            }

        } catch (e) {
            // Si falla, volver a pedir login
            performLogin();
        }
    }

    function applyRolePermissions(){
        const role = state.currentUser.role;
        const tabs = document.querySelectorAll('.tab-button');
        
        tabs.forEach(tab => {
            const view = tab.dataset.view;
            // Si no es admin, ocultar todo lo que no sea POS
            if (role !== 'admin' && view !== 'pos') {
                tab.style.display = 'none';
            } else {
                tab.style.display = 'flex';
            }
        });

        // Actualizar header con nombre usuario
        const headerTitle = document.querySelector('.app-title');
        headerTitle.innerHTML += `<span style="font-size:0.8rem; font-weight:400; color:gray; margin-left:10px;">| ${state.currentUser.nombre} (${role})</span>`;
    }
    
    // Interfaz
    function changeView(newView){
        state.currentView = newView;
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.tab-button[data-view="${newView}"]`).classList.add('active');
        
        // Animacion 
        APP_CONTENT.innerHTML = '<div class="loading-state"><i class="fa-solid fa-circle-notch fa-spin"></i></div>';
        
        setTimeout(() => {
            switch (newView){
                case 'insumos': renderInsumosView(); break;
                case 'productos': renderProductosView(); break;
                case 'pos': renderPosView(); break;
                case 'reporte': renderReporteView(); break;
                case 'usuarios': 
                    loadUsuarios(); 
                    break;
            }
        }, 100); // Pequeño delay para UX
    }
    
    // Cargar datos
    async function loadInsumos(){
        if(state.currentUser.role !== 'admin') return;
        try {
            const res = await apiFetch('api/insumos.php', 'GET');
            state.insumos = res.data;
            if (state.currentView === 'insumos') renderInsumosView();
        } catch(e){}
    }
    
    async function loadProductos(){
        try {
            const res = await apiFetch('api/productos.php', 'GET');
            state.productos = res.data;
            if (state.currentView === 'productos' || state.currentView === 'pos') {
                state.currentView === 'productos' ? renderProductosView() : renderPosView();
            }
        } catch(e){}
    }
    
    async function loadReporteDiario(filter = 'diario'){
        if (!state.currentUser || state.currentUser.role !== 'admin') return;

        try {
            // Pasamos el filtro por URL
            const response = await apiFetch(`api/reporte_diario.php?filter=${filter}`, 'GET');
            state.reporte = response;
            state.reporteFilter = filter; // Guardamos el estado del filtro actual
            
            if (state.currentView === 'reporte'){
                renderReporteView();
            }
        } catch (e){
            console.warn("Error cargando reporte");
        }
    }
    
    // Logica negocio
    
    // Insumos
    async function addInsumo(nombre, unidad, stock, costo){
        await apiFetch('api/insumos.php', 'POST', { nombre, unidad_medida: unidad, stock_actual: stock, costo_por_unidad: costo });
        Swal.fire({ icon: 'success', title: 'Guardado', text: 'Insumo agregado correctamente', timer: 1500, showConfirmButton: false });
        loadInsumos();
    }
    
    async function updateInsumoStock(id_insumo, new_stock){
        await apiFetch('api/insumos.php', 'PUT', { id_insumo, stock_actual: new_stock });
        Swal.fire({ icon: 'success', title: 'Actualizado', text: 'Inventario actualizado', timer: 1500, showConfirmButton: false });
        loadInsumos();
    }
    
    async function deleteInsumo(id_insumo){
        await apiFetch('api/insumos.php', 'DELETE', { id_insumo });
        Swal.fire({ icon: 'success', title: 'Eliminado', text: 'El insumo ha sido eliminado', timer: 1500, showConfirmButton: false });
        loadInsumos();
    }
    
    // Productos
    async function addProducto(nombre, precio, receta){
        await apiFetch('api/productos.php', 'POST', { nombre_producto: nombre, precio_venta: precio, receta });
        Swal.fire({ icon: 'success', title: 'Guardado', text: 'Producto creado con éxito', timer: 1500, showConfirmButton: false });
        loadProductos();
    }
    
    // Ventas
    async function registrarVenta(productos_vendidos, total){
        const id_usuario = state.currentUser ? state.currentUser.id : 1;
        
        await apiFetch('api/ventas.php', 'POST', { 
            productos: productos_vendidos, 
            total: total, 
            id_usuario: id_usuario
        });
        
        Swal.fire({
            icon: 'success',
            title: '¡Venta Exitosa!',
            text: `Total cobrado: $${total.toFixed(2)}`,
            confirmButtonColor: 'var(--success)'
        });

        state.carrito = [];
        renderPosView();
        
        if(state.currentUser.role === 'admin'){
            loadInsumos();
            loadReporteDiario();
        }
    }
    //Usuarios
    async function loadUsuarios() {
        if (!state.currentUser || state.currentUser.role !== 'admin') {
            renderUsuariosView('not_admin');
            return;
        }

        try {
            const res = await apiFetch('api/usuarios.php', 'GET');
            state.usuarios = res.data;
            renderUsuariosView('admin'); 
        } catch (e) {
            console.error("Fallo al cargar usuarios:", e);
            state.usuarios = [];
            renderUsuariosView('admin'); 
        }
    }

    async function addUsuario(nombre, role, password) {
        await apiFetch('api/usuarios.php', 'POST', { nombre, role, password });
        Swal.fire({ 
            icon: 'success', 
            title: 'Guardado', 
            text: 'Usuario registrado correctamente.', 
            timer: 1500, 
            showConfirmButton: false 
        });
        await loadUsuarios(); 
    }

    async function deleteUsuario(id) {
        await apiFetch('api/usuarios.php', 'DELETE', { id });
        Swal.fire({ 
            icon: 'success', 
            title: 'Eliminado', 
            text: 'Usuario eliminado con éxito.', 
            timer: 1500, 
            showConfirmButton: false 
        });
        await loadUsuarios(); 
    }
    
    // Handlers y eventos

    async function handleNewUserSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const nombre = form.nombre.value;
        const role = form.role.value;
        const password = form.password.value;
        if (nombre && role && password) {
            try {
                await addUsuario(nombre, role, password);
                form.reset();
            } catch (e) { 
                console.error("Error al registrar usuario:", e);
            }
        }
    }
    function handleDeleteUserClick(id) {
        const user = (state.usuarios || []).find(u => u.id == id);
        if (!user) return;
        
        Swal.fire({
            title: `¿Eliminar a ${user.nombre}?`,
            text: `El usuario con rol "${user.role}" será eliminado.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteUsuario(id);
            }
        });
    }

    async function handleNewInsumoSubmit(e){
        e.preventDefault();
        const form = e.target;
        const nombre = form.nombre.value;
        const unidad = form.unidad_medida.value;
        const stock = parseFloat(form.stock_actual.value);
        const costo = parseFloat(form.costo_por_unidad.value);
        
        if(nombre && unidad && !isNaN(stock)){
            await addInsumo(nombre, unidad, stock, costo);
            form.reset();
        }
    }
    
    function handleStockUpdateClick(id_insumo){
        const insumo = state.insumos.find(i => i.id_insumo == id_insumo);
        if(!insumo) return;
        
        Swal.fire({
            title: `Ajustar Stock: ${insumo.nombre}`,
            input: 'number',
            inputValue: insumo.stock_actual,
            inputLabel: `Unidad: ${insumo.unidad_medida}`,
            showCancelButton: true,
            confirmButtonText: 'Actualizar',
            confirmButtonColor: 'var(--primary)',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value || isNaN(value)) return 'Debes escribir un número válido';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                updateInsumoStock(id_insumo, parseFloat(result.value));
            }
        });
    }
    
    function handleDeleteInsumoClick(id_insumo){
        Swal.fire({
            title: '¿Eliminar insumo?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteInsumo(id_insumo);
            }
        });
    }
    
    // Handlers Productos
    function addRecetaInput(idContainer = 'nuevo'){
        const container = document.getElementById(`receta-container-${idContainer}`);
        const index = container.children.length;
        
        const div = document.createElement('div');
        div.className = 'receta-row';
        div.innerHTML = `
            <select name="receta_insumo" class="form-control">
                <option value="">Seleccionar Insumo...</option>
                ${state.insumos.map(i => `<option value="${i.id_insumo}">${i.nombre} (${i.unidad_medida})</option>`).join('')}
            </select>
            <input type="number" step="0.01" class="cantidad-input" placeholder="Cantidad" required>
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()"><i class="fa-solid fa-trash"></i></button>
        `;
        container.appendChild(div);
    }
    
    async function handleNewProductoSubmit(e){
        e.preventDefault();
        const form = e.target;
        const nombre = form.querySelector('[name="nombre_producto"]').value;
        const precio = parseFloat(form.querySelector('[name="precio_venta"]').value);
        
        const receta = [];
        form.querySelectorAll('.receta-row').forEach(row => {
            const id = row.querySelector('select').value;
            const cant = row.querySelector('input').value;
            if(id && cant) receta.push({ id_insumo: id, cantidad_requerida: cant });
        });
        
        if(nombre && precio > 0){
            await addProducto(nombre, precio, receta);
            form.reset();
            document.getElementById('receta-container-nuevo').innerHTML = '';
        }
    }
    
    // Punto de venta logica
    function addItemToTicket(id_producto){
        const prod = state.productos.find(p => p.id_producto == id_producto);
        if(!prod) return;
        
        const item = state.carrito.find(i => i.id_producto == id_producto);
        if(item) item.cantidad++;
        else state.carrito.push({ ...prod, cantidad: 1, precio_venta: parseFloat(prod.precio_venta) });
        
        renderPosView();
    }
    
    function updateTicketItemQuantity(id, qty){
        const item = state.carrito.find(i => i.id_producto == id);
        if(item){
            item.cantidad = qty;
            if(item.cantidad <= 0) state.carrito = state.carrito.filter(i => i.id_producto != id);
            renderPosView();
        }
    }
    
    function handleProcessSale(){
        if(state.carrito.length === 0) return Swal.fire('Carrito vacío', 'Agrega productos antes de cobrar', 'warning');
        
        const total = state.carrito.reduce((sum, i) => sum + (i.precio_venta * i.cantidad), 0);
        
        Swal.fire({
            title: 'Confirmar Venta',
            text: `Total a cobrar: $${total.toFixed(2)}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Cobrar',
            confirmButtonColor: 'var(--success)'
        }).then((res) => {
            if(res.isConfirmed){
                const items = state.carrito.map(i => ({ id_producto: i.id_producto, cantidad: i.cantidad }));
                registrarVenta(items, total);
            }
        });
    }
    
    function clearTicket(){
        if(state.carrito.length === 0) return;
        Swal.fire({
            title: '¿Limpiar ticket?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, limpiar'
        }).then((res) => {
            if(res.isConfirmed){
                state.carrito = [];
                renderPosView();
            }
        });
    }
    
    // Renders

    function renderUsuariosView(roleStatus) { 
        if (roleStatus === 'not_admin') {
            APP_CONTENT.innerHTML = '<p class="text-center text-gray-500 mt-10">Acceso Denegado. Se requiere ser Administrador.</p>';
            return;
        }
        
        const usuariosList = state.usuarios || [];

        APP_CONTENT.innerHTML = `
            <div class="fade-in">
                <div class="card">
                    <h3><i class="fa-solid fa-user-plus"></i> Registrar Nuevo Usuario</h3>
                    <form id="form-nuevo-usuario" class="form-grid two-col">
                        <input type="text" name="nombre" placeholder="Nombre (usado como usuario/PIN)" required>
                        <select name="role" class="form-control" required>
                            <option value="">Selecciona Rol...</option>
                            <option value="admin">Administrador</option>
                            <option value="colaborador">Colaborador</option>
                        </select>
                        <input type="password" name="password" placeholder="PIN/Password de Acceso" required>
                        <button type="submit" class="btn btn-primary" style="grid-column: 2">Guardar Usuario</button>
                    </form>
                </div>
        
                <h3><i class="fa-solid fa-users"></i> Usuarios Registrados</h3>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Nombre/Usuario</th>
                                <th>Rol</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${usuariosList.map(u => `
                                <tr>
                                    <td><strong>${u.nombre}</strong></td>
                                    <td>
                                        <span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-secondary'}">
                                            ${u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-danger btn-sm" onclick="window.app.handleDeleteUserClick(${u.id})">
                                            <i class="fa-solid fa-trash"></i> Eliminar
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        document.getElementById('form-nuevo-usuario').addEventListener('submit', handleNewUserSubmit);
    }
    
    function renderInsumosView(){
        APP_CONTENT.innerHTML = `
            <div class="fade-in">
                <div class="card">
                    <h3><i class="fa-solid fa-plus-circle"></i> Nuevo Insumo</h3>
                    <form id="form-nuevo-insumo" class="form-grid">
                        <input type="text" name="nombre" placeholder="Nombre (ej. Cebolla)" required>
                        <input type="text" name="unidad_medida" placeholder="Unidad (kg, lt)" required>
                        <input type="number" step="0.01" name="stock_actual" placeholder="Stock Inicial" required>
                        <input type="number" step="0.01" name="costo_por_unidad" placeholder="Costo Unitario ($)" required>
                        <button type="submit" class="btn btn-primary" style="grid-column: 1/-1">Guardar Insumo</button>
                    </form>
                </div>
        
                <h3><i class="fa-solid fa-list"></i> Inventario Actual</h3>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Stock</th>
                                <th>Costo Unitario</th>
                                <th>Valor Total</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.insumos.map(i => `
                                <tr>
                                    <td><strong>${i.nombre}</strong></td>
                                    <td>${parseFloat(i.stock_actual).toFixed(2)} ${i.unidad_medida}</td>
                                    <td>$${parseFloat(i.costo_por_unidad).toFixed(2)}</td>
                                    <td>$${(i.stock_actual * i.costo_por_unidad).toFixed(2)}</td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="window.app.handleStockUpdateClick(${i.id_insumo})"><i class="fa-solid fa-pen"></i></button>
                                        <button class="btn btn-danger btn-sm" onclick="window.app.handleDeleteInsumoClick(${i.id_insumo})"><i class="fa-solid fa-trash"></i></button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        document.getElementById('form-nuevo-insumo').addEventListener('submit', handleNewInsumoSubmit);
    }
    
    function renderProductosView(){
        APP_CONTENT.innerHTML = `
            <div class="fade-in">
                <div class="card">
                    <h3><i class="fa-solid fa-burger"></i> Nuevo Producto</h3>
                    <form id="form-nuevo-producto">
                        <div class="form-grid two-col">
                            <input type="text" name="nombre_producto" placeholder="Nombre del Producto" required>
                            <input type="number" step="0.01" name="precio_venta" placeholder="Precio de Venta ($)" required>
                        </div>
                        
                        <div style="margin: 1rem 0;">
                            <h4>Receta (Insumos necesarios)</h4>
                            <div id="receta-container-nuevo"></div>
                            <button type="button" class="btn btn-secondary btn-sm mt-2" onclick="window.app.addRecetaInput()"><i class="fa-solid fa-plus"></i> Agregar ingrediente</button>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">Guardar Producto</button>
                    </form>
                </div>
        
                <h3>Menú Actual</h3>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Precio</th>
                                <th>Receta</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.productos.map(p => `
                                <tr>
                                    <td><strong>${p.nombre_producto}</strong></td>
                                    <td><span style="color:var(--success); font-weight:bold;">$${parseFloat(p.precio_venta).toFixed(2)}</span></td>
                                    <td>
                                        <small style="color:var(--text-secondary)">
                                        ${p.receta.map(r => `${r.insumo_nombre} (${parseFloat(r.cantidad_requerida)} ${r.unidad_medida})`).join(', ')}
                                        </small>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        document.getElementById('form-nuevo-producto').addEventListener('submit', handleNewProductoSubmit);
    }
    
    function renderPosView(){
        const total = state.carrito.reduce((sum, i) => sum + (i.precio_venta * i.cantidad), 0);
        
        APP_CONTENT.innerHTML = `
            <div class="pos-layout fade-in">
                <div class="card" style="height: fit-content;">
                    <h3><i class="fa-solid fa-utensils"></i> Menú</h3>
                    <div class="product-grid">
                        ${state.productos.map(p => `
                            <div class="product-card" onclick="window.app.addItemToTicket(${p.id_producto})">
                                <div class="product-name">${p.nombre_producto}</div>
                                <div class="product-price">$${parseFloat(p.precio_venta).toFixed(2)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="ticket-area">
                    <div class="card">
                        <h3><i class="fa-solid fa-receipt"></i> Ticket</h3>
                        <div class="ticket-list">
                            ${state.carrito.length === 0 ? '<p style="text-align:center; padding:1rem; color:#9ca3af;">Ticket vacío</p>' : ''}
                            ${state.carrito.map(item => `
                                <div class="ticket-item">
                                    <div>
                                        <div style="font-weight:600;">${item.nombre_producto}</div>
                                        <small class="text-gray">$${item.precio_venta} c/u</small>
                                    </div>
                                    <div class="item-controls">
                                        <input type="number" min="1" value="${item.cantidad}" 
                                               onchange="window.app.updateTicketItemQuantity(${item.id_producto}, parseInt(this.value))" 
                                               class="quantity-input">
                                        <button class="btn btn-danger btn-sm" onclick="window.app.updateTicketItemQuantity(${item.id_producto}, 0)">
                                            <i class="fa-solid fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="ticket-summary">
                            <div class="total-text">
                                <span>Total</span>
                                <span>$${total.toFixed(2)}</span>
                            </div>
                            <button class="btn btn-success btn-block" onclick="window.app.handleProcessSale()">
                                <i class="fa-solid fa-check"></i> Cobrar
                            </button>
                            <button class="btn btn-secondary btn-block" style="margin-top:0.5rem;" onclick="window.app.clearTicket()">
                                <i class="fa-solid fa-trash"></i> Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    function renderReporteView(){
        const { resumen, consumo_insumos, productos_vendidos, ventas_detalladas, periodo } = state.reporte;
        
        const titulos = {
            'diario': `Reporte de Hoy (${new Date().toLocaleDateString()})`,
            'mensual': 'Reporte del Mes Actual',
            'historico': 'Historial Completo de Ventas'
        };
        const tituloActual = titulos[periodo] || titulos['diario'];

        // Helper para clases de botones activos
        const btnClass = (type) => state.reporteFilter === type ? 'btn-primary' : 'btn-secondary';

        APP_CONTENT.innerHTML = `
            <div class="fade-in">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
                    <h2>${tituloActual}</h2>
                    
                    <div class="btn-group">
                        <button class="btn ${btnClass('diario')}" onclick="window.app.loadReporteDiario('diario')">Hoy</button>
                        <button class="btn ${btnClass('mensual')}" onclick="window.app.loadReporteDiario('mensual')">Este Mes</button>
                        <button class="btn ${btnClass('historico')}" onclick="window.app.loadReporteDiario('historico')">Histórico</button>
                    </div>
                </div>
                
                <div class="reporte-summary">
                    <div class="card summary-card">
                        <h4>Venta Total</h4>
                        <p class="summary-value text-success">$${parseFloat(resumen.total_ventas || 0).toFixed(2)}</p>
                    </div>
                    <div class="card summary-card">
                        <h4>Transacciones</h4>
                        <p class="summary-value">${resumen.num_ventas || 0}</p>
                    </div>
                    <div class="card summary-card">
                        <h4>Prod. Vendidos</h4>
                        <p class="summary-value">${resumen.total_productos || 0}</p>
                    </div>
                </div>

                <div class="report-grid">
                    <div class="card">
                        <h3>Productos Más Vendidos</h3>
                        <canvas id="chartVentas"></canvas>
                    </div>
                    <div class="card">
                        <h3>Merma (Insumos Usados)</h3>
                        <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                            <table class="data-table">
                                <thead><tr><th>Insumo</th><th>Total Usado</th></tr></thead>
                                <tbody>
                                    ${consumo_insumos.length ? consumo_insumos.map(c => `
                                        <tr><td>${c.insumo_nombre}</td><td>${parseFloat(c.consumo_total).toFixed(2)} ${c.unidad_medida}</td></tr>
                                    `).join('') : '<tr><td colspan="2" class="text-center">Sin datos</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="card mt-4">
                    <h3><i class="fa-solid fa-list-ol"></i> Detalle de Ventas</h3>
                    <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Fecha/Hora</th> <th>Atendió</th>
                                    <th>Productos</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ventas_detalladas && ventas_detalladas.length > 0 ? ventas_detalladas.map(v => `
                                    <tr>
                                        <td>${v.fecha_formato || v.hora}</td>
                                        <td><span class="badge">${v.usuario}</span></td>
                                        <td>${v.descripcion_productos || 'Varios'}</td>
                                        <td style="font-weight:bold; color:var(--success)">$${parseFloat(v.total).toFixed(2)}</td>
                                    </tr>
                                `).join('') : '<tr><td colspan="4" class="text-center">No hay registros en este periodo.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Render Chart 
        if(document.getElementById('chartVentas')){
            new Chart(document.getElementById('chartVentas'), {
                type: 'bar',
                data: {
                    labels: productos_vendidos.map(p => p.nombre_producto),
                    datasets: [{
                        label: 'Unidades',
                        data: productos_vendidos.map(p => p.total_vendido),
                        backgroundColor: 'rgba(255, 136, 0, 0.6)',
                        borderColor: 'rgba(255, 136, 0, 1)',
                        borderWidth: 1
                    }]
                },
                options: { responsive: true, scales: { y: { beginAtZero: true } } }
            });
        }
    }
    
    // Inicializacion
    function init(){
        setupStaticListeners();
        performLogin();
    }
    
    function setupStaticListeners(){
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', (e) => changeView(e.currentTarget.dataset.view));
        });
    }
    
    document.addEventListener('DOMContentLoaded', init);
    
    return {
        // funciones publicas
        loadReporteDiario, handleStockUpdateClick, handleDeleteInsumoClick, addRecetaInput,
        handleNewInsumoSubmit, handleNewProductoSubmit,
        addItemToTicket, updateTicketItemQuantity, handleProcessSale, clearTicket,
        //funciones de usuario
        loadUsuarios,
        handleDeleteUserClick,
        handleNewUserSubmit,
        loadReporteDiario, handleStockUpdateClick, handleDeleteInsumoClick, addRecetaInput,
        handleNewInsumoSubmit, handleNewProductoSubmit,
        addItemToTicket, updateTicketItemQuantity, handleProcessSale, clearTicket,
        // helpers de vista
        renderInsumosView, renderProductosView, renderPosView, renderReporteView,
        renderUsuariosView, 
        // Estado
        state
    };
})();