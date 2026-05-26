/**
 * ============================================================
 *  INMOBILIARIA PNK — Mapa Interactivo con Leaflet.js
 *  Marcadores dinámicos, filtros, panel lateral, clusters
 * ============================================================
 */

(function () {
    'use strict';

    var map, markersLayer, allMarkers = [];
    var selectedPropId = null;

    // ── Íconos personalizados por categoría ───────────────────
    var PIN_COLORS = {
        casa: { bg: '#10b981', icon: 'fa-home', label: 'Casa' },
        depto: { bg: '#3b82f6', icon: 'fa-building', label: 'Depto' },
        terreno: { bg: '#f59e0b', icon: 'fa-mountain', label: 'Terreno' },
        comercial: { bg: '#8b5cf6', icon: 'fa-store', label: 'Comercial' }
    };

    function createCustomIcon(categoria, isSelected) {
        var config = PIN_COLORS[categoria] || PIN_COLORS.casa;
        var size = isSelected ? 48 : 38;
        var bgColor = isSelected ? '#f59e0b' : config.bg;
        var borderColor = isSelected ? '#fff' : 'rgba(255,255,255,0.9)';
        var shadow = isSelected ? '0 0 0 4px rgba(245,158,11,0.3),' : '';

        return L.divIcon({
            className: 'pnk-map-pin',
            html: '<div style="' +
                'width:' + size + 'px;height:' + size + 'px;' +
                'background:' + bgColor + ';' +
                'border:3px solid ' + borderColor + ';' +
                'border-radius:50% 50% 50% 0;' +
                'transform:rotate(-45deg);' +
                'display:flex;align-items:center;justify-content:center;' +
                'box-shadow:' + shadow + '0 4px 12px rgba(0,0,0,0.3);' +
                'transition:all 0.3s ease;' +
                '">' +
                '<i class="fas ' + config.icon + '" style="transform:rotate(45deg);color:#fff;font-size:' + (isSelected ? '1.3' : '1') + 'rem;"></i>' +
                '</div>',
            iconSize: [size, size],
            iconAnchor: [size / 2, size],
            popupAnchor: [0, -size]
        });
    }

    // ── Inicializar mapa ──────────────────────────────────────
    function initMap() {
        var mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        // Centrar en La Serena
        map = L.map('map', {
            center: [-29.9027, -71.2519],
            zoom: 13,
            zoomControl: false
        });

        // Tile layer — OpenStreetMap con estilo
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // Controles de zoom en la esquina inferior derecha
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Layer para marcadores
        markersLayer = L.layerGroup().addTo(map);

        // Cargar propiedades
        loadMarkers();

        // Setup de filtros
        setupFilters();

        // Setup de controles
        setupControls();

        // Renderizar lista en panel
        renderPropertyList();
    }

    // ── Cargar marcadores desde localStorage ──────────────────
    function loadMarkers(filters) {
        markersLayer.clearLayers();
        allMarkers = [];

        var propiedades = PNK.getData(PNK.KEYS.PROPIEDADES);

        // Aplicar filtros
        if (filters) {
            if (filters.categoria && filters.categoria !== 'todas') {
                propiedades = propiedades.filter(function (p) {
                    return p.categoria === filters.categoria;
                });
            }
            if (filters.precioMin) {
                propiedades = propiedades.filter(function (p) {
                    return (p.precioUF || 0) >= filters.precioMin;
                });
            }
            if (filters.precioMax) {
                propiedades = propiedades.filter(function (p) {
                    return (p.precioUF || 99999) <= filters.precioMax;
                });
            }
        }

        // Solo mostrar publicadas
        propiedades = propiedades.filter(function (p) {
            return p.estado === 'publicado' || p.estado === 'arrendado';
        });

        propiedades.forEach(function (p) {
            if (!p.lat || !p.lng) return;

            var icon = createCustomIcon(p.categoria, p.id === selectedPropId);
            var marker = L.marker([p.lat, p.lng], { icon: icon });

            // Popup al hover
            var precio = p.precioUF ? PNK.formatUF(p.precioUF) : PNK.formatCLP(p.precioCLP);
            marker.bindTooltip(
                '<strong>' + PNK.escapeHTML(p.titulo) + '</strong><br>' + precio,
                { direction: 'top', offset: [0, -40], className: 'pnk-tooltip' }
            );

            // Click → mostrar detalle
            marker.on('click', function () {
                selectProperty(p.id);
            });

            marker.propData = p;
            markersLayer.addLayer(marker);
            allMarkers.push(marker);
        });

        // Actualizar contador
        var counter = document.getElementById('propCounter');
        var total = PNK.getData(PNK.KEYS.PROPIEDADES).filter(function (p) {
            return p.estado === 'publicado' || p.estado === 'arrendado';
        }).length;
        if (counter) {
            counter.textContent = 'Mostrando ' + propiedades.length + ' de ' + total + ' propiedades';
        }

        // Renderizar lista
        renderPropertyList(propiedades);
    }

    // ── Seleccionar propiedad ─────────────────────────────────
    function selectProperty(id) {
        selectedPropId = id;

        var propiedades = PNK.getData(PNK.KEYS.PROPIEDADES);
        var prop = null;
        for (var i = 0; i < propiedades.length; i++) {
            if (propiedades[i].id === id) {
                prop = propiedades[i];
                break;
            }
        }

        if (!prop) return;

        // Mostrar panel de detalle
        showPropertyDetail(prop);

        // Actualizar íconos de los marcadores
        allMarkers.forEach(function (m) {
            var cat = m.propData.categoria;
            var isSelected = m.propData.id === id;
            m.setIcon(createCustomIcon(cat, isSelected));
        });

        // Fly to
        map.flyTo([prop.lat, prop.lng], 16, { duration: 1 });
    }

    // ── Mostrar detalle de propiedad en panel ─────────────────
    function showPropertyDetail(p) {
        var detailPanel = document.getElementById('propDetail');
        var listPanel = document.getElementById('propList');
        var promptPanel = document.getElementById('selectionPrompt');

        if (promptPanel) promptPanel.style.display = 'none';
        if (listPanel) listPanel.style.display = 'none';
        if (detailPanel) detailPanel.style.display = 'block';

        var precio = p.precioUF ? PNK.formatUF(p.precioUF) : PNK.formatCLP(p.precioCLP);
        if (p.operacion === 'Arriendo') precio += ' / mes';

        var statusBadge = PNK.getStatusBadge(p.estado);

        var featuresHTML = '';
        if (p.dormitorios) featuresHTML += '<div class="feature-item"><i class="fas fa-bed"></i> ' + p.dormitorios + ' Hab</div>';
        if (p.banos) featuresHTML += '<div class="feature-item"><i class="fas fa-bath"></i> ' + p.banos + ' Baños</div>';
        if (p.superficieTotal) featuresHTML += '<div class="feature-item"><i class="fas fa-ruler-combined"></i> ' + p.superficieTotal + ' m²</div>';

        var extrasHTML = '';
        if (p.extras && p.extras.length) {
            p.extras.forEach(function (extra) {
                extrasHTML += '<span class="extra-tag"><i class="fas fa-check-circle"></i> ' + PNK.escapeHTML(extra) + '</span>';
            });
        }

        detailPanel.innerHTML = `
            <button class="btn-back-detail" onclick="PNK.showPropertyList()">
                <i class="fas fa-arrow-left"></i> Volver a la lista
            </button>
            <img src="${PNK.escapeHTML(p.imagen || 'img/prop1.png')}" alt="${PNK.escapeHTML(p.titulo)}">
            <div class="detail-header">
                <span class="price">${precio}</span>
                <span class="badge ${statusBadge.class}">${statusBadge.text}</span>
            </div>
            <h2>${PNK.escapeHTML(p.titulo)}</h2>
            <p class="detail-location"><i class="fas fa-map-marker-alt"></i> ${PNK.escapeHTML(p.direccion)}</p>
            <p class="detail-type"><i class="fas fa-tag"></i> ${PNK.escapeHTML(p.tipo)} — ${PNK.escapeHTML(p.operacion)}</p>
            <p class="detail-desc">${PNK.escapeHTML(p.descripcion || '')}</p>
            <div class="features">${featuresHTML}</div>
            ${extrasHTML ? '<div class="extras-grid">' + extrasHTML + '</div>' : ''}
            <a href="#" class="btn-buy" onclick="PNK.toast.info('Función de contacto en desarrollo.');return false;">
                <i class="fas fa-envelope me-2"></i>Contactar Agente
            </a>
        `;
    }

    // ── Renderizar lista de propiedades en panel ──────────────
    function renderPropertyList(propiedades) {
        var listPanel = document.getElementById('propList');
        if (!listPanel) return;

        if (!propiedades) {
            propiedades = PNK.getData(PNK.KEYS.PROPIEDADES).filter(function (p) {
                return p.estado === 'publicado' || p.estado === 'arrendado';
            });
        }

        if (propiedades.length === 0) {
            listPanel.innerHTML = '<div class="empty-list"><i class="fas fa-search"></i><p>No hay propiedades que coincidan con los filtros.</p></div>';
            return;
        }

        var html = '';
        propiedades.forEach(function (p) {
            var precio = p.precioUF ? PNK.formatUF(p.precioUF) : PNK.formatCLP(p.precioCLP);
            var config = PIN_COLORS[p.categoria] || PIN_COLORS.casa;
            var isSelected = p.id === selectedPropId;

            html += '<div class="prop-card ' + (isSelected ? 'prop-card-active' : '') + '" onclick="PNK.selectProp(\'' + p.id + '\')">';
            html += '<img src="' + PNK.escapeHTML(p.imagen || 'img/prop1.png') + '" alt="' + PNK.escapeHTML(p.titulo) + '">';
            html += '<div class="prop-card-body">';
            html += '<div class="prop-card-price">' + precio + '</div>';
            html += '<div class="prop-card-title">' + PNK.escapeHTML(p.titulo) + '</div>';
            html += '<div class="prop-card-location"><i class="fas fa-map-marker-alt"></i> ' + PNK.escapeHTML(PNK.truncate(p.direccion, 30)) + '</div>';
            html += '<div class="prop-card-features">';
            if (p.dormitorios) html += '<span><i class="fas fa-bed"></i> ' + p.dormitorios + '</span>';
            if (p.banos) html += '<span><i class="fas fa-bath"></i> ' + p.banos + '</span>';
            if (p.superficieTotal) html += '<span><i class="fas fa-ruler-combined"></i> ' + p.superficieTotal + 'm²</span>';
            html += '</div>';
            html += '</div></div>';
        });

        listPanel.innerHTML = html;
    }

    // ── Mostrar lista (volver del detalle) ────────────────────
    PNK.showPropertyList = function () {
        selectedPropId = null;
        var detailPanel = document.getElementById('propDetail');
        var listPanel = document.getElementById('propList');
        var promptPanel = document.getElementById('selectionPrompt');

        if (detailPanel) detailPanel.style.display = 'none';
        if (listPanel) listPanel.style.display = 'block';
        if (promptPanel) promptPanel.style.display = 'none';

        // Reset marcadores
        allMarkers.forEach(function (m) {
            m.setIcon(createCustomIcon(m.propData.categoria, false));
        });

        // Zoom out
        if (allMarkers.length > 0) {
            var group = L.featureGroup(allMarkers);
            map.flyToBounds(group.getBounds().pad(0.2), { duration: 0.8 });
        }

        renderPropertyList();
    };

    // ── API pública para seleccionar ──────────────────────────
    PNK.selectProp = function (id) {
        selectProperty(id);
    };

    // ── Setup de filtros ──────────────────────────────────────
    function setupFilters() {
        // Filtro por categoría
        var tabs = document.querySelectorAll('.filter-tab');
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                tabs.forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                applyFilters();
            });
        });

        // Filtro por precio
        var precioMin = document.getElementById('precioMin');
        var precioMax = document.getElementById('precioMax');
        if (precioMin) {
            precioMin.addEventListener('input', function () {
                var label = document.getElementById('precioMinLabel');
                if (label) label.textContent = PNK.formatUF(parseInt(this.value));
                applyFilters();
            });
        }
        if (precioMax) {
            precioMax.addEventListener('input', function () {
                var label = document.getElementById('precioMaxLabel');
                if (label) label.textContent = PNK.formatUF(parseInt(this.value));
                applyFilters();
            });
        }
    }

    function applyFilters() {
        var activeTab = document.querySelector('.filter-tab.active');
        var categoria = activeTab ? activeTab.dataset.cat : 'todas';

        var precioMin = document.getElementById('precioMin');
        var precioMax = document.getElementById('precioMax');

        var filters = {
            categoria: categoria,
            precioMin: precioMin ? parseInt(precioMin.value) : 0,
            precioMax: precioMax ? parseInt(precioMax.value) : 99999
        };

        // Reset selección
        selectedPropId = null;
        var detailPanel = document.getElementById('propDetail');
        var listPanel = document.getElementById('propList');
        if (detailPanel) detailPanel.style.display = 'none';
        if (listPanel) listPanel.style.display = 'block';

        loadMarkers(filters);

        // Zoom para mostrar todos los marcadores visibles
        if (allMarkers.length > 0) {
            var group = L.featureGroup(allMarkers);
            map.flyToBounds(group.getBounds().pad(0.2), { duration: 0.8 });
        }
    }

    // ── Controles del mapa ────────────────────────────────────
    function setupControls() {
        // Botón ver todas
        var btnAll = document.getElementById('btnVerTodas');
        if (btnAll) {
            btnAll.addEventListener('click', function () {
                // Reset filtros
                document.querySelectorAll('.filter-tab').forEach(function (t) { t.classList.remove('active'); });
                var allTab = document.querySelector('.filter-tab[data-cat="todas"]');
                if (allTab) allTab.classList.add('active');

                var precioMin = document.getElementById('precioMin');
                var precioMax = document.getElementById('precioMax');
                if (precioMin) precioMin.value = precioMin.min;
                if (precioMax) precioMax.value = precioMax.max;

                PNK.showPropertyList();
                loadMarkers();

                if (allMarkers.length > 0) {
                    var group = L.featureGroup(allMarkers);
                    map.flyToBounds(group.getBounds().pad(0.2), { duration: 0.8 });
                }
            });
        }

        // Botón mi ubicación
        var btnGeo = document.getElementById('btnGeolocate');
        if (btnGeo) {
            btnGeo.addEventListener('click', function () {
                if (!navigator.geolocation) {
                    PNK.toast.warning('Tu navegador no soporta geolocalización.');
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    function (pos) {
                        map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1.5 });
                        L.marker([pos.coords.latitude, pos.coords.longitude], {
                            icon: L.divIcon({
                                className: 'pnk-geo-pin',
                                html: '<div style="width:16px;height:16px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 6px rgba(59,130,246,0.3),0 2px 8px rgba(0,0,0,0.3);"></div>',
                                iconSize: [16, 16],
                                iconAnchor: [8, 8]
                            })
                        }).addTo(map).bindPopup('Tu ubicación').openPopup();
                        PNK.toast.success('Ubicación encontrada.');
                    },
                    function () {
                        PNK.toast.error('No se pudo obtener tu ubicación.');
                    }
                );
            });
        }

        // Toggle panel en mobile
        var btnToggle = document.getElementById('btnTogglePanel');
        if (btnToggle) {
            btnToggle.addEventListener('click', function () {
                var panel = document.querySelector('.info-panel');
                if (panel) panel.classList.toggle('panel-open');
            });
        }
    }

    // ── Mini-mapa para formulario de nueva propiedad ──────────
    function initMiniMap() {
        var miniMapEl = document.getElementById('miniMap');
        if (!miniMapEl) return;

        var lat = parseFloat(document.getElementById('propLat')?.value) || -29.9027;
        var lng = parseFloat(document.getElementById('propLng')?.value) || -71.2519;

        var miniMap = L.map('miniMap', {
            center: [lat, lng],
            zoom: 14,
            zoomControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OSM',
            maxZoom: 19
        }).addTo(miniMap);

        var marker = L.marker([lat, lng], { draggable: true }).addTo(miniMap);

        // Click en mapa → mover marcador
        miniMap.on('click', function (e) {
            marker.setLatLng(e.latlng);
            updateLatLng(e.latlng.lat, e.latlng.lng);
        });

        // Drag del marcador
        marker.on('dragend', function () {
            var pos = marker.getLatLng();
            updateLatLng(pos.lat, pos.lng);
        });

        function updateLatLng(lat, lng) {
            var latInput = document.getElementById('propLat');
            var lngInput = document.getElementById('propLng');
            if (latInput) latInput.value = lat.toFixed(6);
            if (lngInput) lngInput.value = lng.toFixed(6);

            var coordLabel = document.getElementById('coordLabel');
            if (coordLabel) coordLabel.textContent = 'Lat: ' + lat.toFixed(4) + ' | Lng: ' + lng.toFixed(4);
        }

        // Exponer para edición
        window.updateMiniMap = function (lat, lng) {
            marker.setLatLng([lat, lng]);
            miniMap.setView([lat, lng], 15);
        };

        // Invalidar tamaño después de render
        setTimeout(function () { miniMap.invalidateSize(); }, 300);
    }

    // ── Inicialización ────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        var path = window.location.pathname;

        if (path.indexOf('mapa_interactivo') !== -1) {
            initMap();
        }

        if (path.indexOf('nueva_propiedad') !== -1) {
            initMiniMap();
        }
    });

})();
