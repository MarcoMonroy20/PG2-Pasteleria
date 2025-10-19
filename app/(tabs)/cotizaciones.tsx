import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Modal, Platform, Alert, Image } from 'react-native';
import Colors from '../../constants/Colors';
import { useNavigation } from 'expo-router';
import * as DB from '../../services/db';
import { Asset } from 'expo-asset';
import { useAuth } from '../../contexts/AuthContext';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type ItemCotizacion = {
  id: number;
  nombre: string;
  cantidad: number;
  precioUnit: number;
  descripcion?: string;
};

export default function CotizacionesScreen() {
  const navigation = useNavigation();
  const { hasPermission } = useAuth();
  const [cliente, setCliente] = useState('');
  const [items, setItems] = useState<ItemCotizacion[]>([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  // Verificar permisos de acceso
  if (!hasPermission('view_cotizaciones')) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={styles.accessDeniedTitle}>Acceso Denegado</Text>
        <Text style={styles.accessDeniedText}>
          No tienes permisos para acceder a las cotizaciones.
        </Text>
        <Text style={styles.accessDeniedSubtext}>
          Contacta al administrador si necesitas acceso.
        </Text>
      </View>
    );
  }
  const [itemNombre, setItemNombre] = useState('');
  const [itemCantidad, setItemCantidad] = useState('1');
  const [itemPrecioUnit, setItemPrecioUnit] = useState('');
  const [itemDescripcion, setItemDescripcion] = useState('');

  const total = useMemo(
    () => items.reduce((acc, it) => acc + (it.cantidad * it.precioUnit), 0),
    [items]
  );

  // Datos fijos de la empresa (puedes ajustarlos aquí)
  const [empresa, setEmpresa] = useState({
    nombre: 'Sweet Cakes',
    telefono: '53597287',
    email: '',
    direccion: '',
    contacto: 'Raquel Alejandra Rousselin Pellecer',
  });

  React.useEffect(() => {
    (async () => {
      try {
        const s: any = (await (DB as any).obtenerSettings?.()) || {};
        setEmpresa((prev) => ({
          ...prev,
          nombre: s.company_name || prev.nombre,
          telefono: s.phone || prev.telefono,
          contacto: s.contact_name || prev.contacto,
        }));
      } catch {}
    })();
  }, []);

  const limpiarItemForm = () => {
    setEditingItemId(null);
    setItemNombre('');
    setItemCantidad('1');
    setItemPrecioUnit('');
    setItemDescripcion('');
  };

  const abrirAgregar = () => {
    limpiarItemForm();
    setShowItemModal(true);
  };

  const abrirEditar = (item: ItemCotizacion) => {
    setEditingItemId(item.id);
    setItemNombre(item.nombre);
    setItemCantidad(String(item.cantidad));
    setItemPrecioUnit(String(item.precioUnit));
    setItemDescripcion(item.descripcion || '');
    setShowItemModal(true);
  };

  const guardarItem = () => {
    const nombre = itemNombre.trim();
    const cantidad = parseInt(itemCantidad) || 1;
    if (itemPrecioUnit.trim() === '') {
      Platform.OS === 'web' ? alert('El precio unitario es obligatorio') : Alert.alert('Error', 'El precio unitario es obligatorio');
      return;
    }
    const precioUnit = parseFloat(itemPrecioUnit);
    if (!nombre) {
      Platform.OS === 'web' ? alert('El nombre del producto es obligatorio') : Alert.alert('Error', 'El nombre del producto es obligatorio');
      return;
    }
    if (isNaN(precioUnit) || precioUnit <= 0) {
      Platform.OS === 'web' ? alert('El precio unitario debe ser un número mayor a 0') : Alert.alert('Error', 'El precio unitario debe ser un número mayor a 0');
      return;
    }
    if (cantidad <= 0) {
      Platform.OS === 'web' ? alert('La cantidad debe ser un entero mayor o igual a 1') : Alert.alert('Error', 'La cantidad debe ser un entero mayor o igual a 1');
      return;
    }

    if (editingItemId != null) {
      setItems(prev => prev.map(it => it.id === editingItemId ? { ...it, nombre, cantidad, precioUnit, descripcion: itemDescripcion || undefined } : it));
    } else {
      const nuevo: ItemCotizacion = { id: Date.now(), nombre, cantidad, precioUnit, descripcion: itemDescripcion || undefined };
      setItems(prev => [...prev, nuevo]);
    }
    setShowItemModal(false);
    limpiarItemForm();
  };

  const eliminarItem = (id: number) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm('¿Eliminar este producto de la cotización?');
      if (!ok) return;
      setItems(prev => prev.filter(it => it.id !== id));
    } else {
      Alert.alert('Confirmar', '¿Eliminar este producto de la cotización?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => setItems(prev => prev.filter(it => it.id !== id)) },
      ]);
    }
  };

  const formatCurrency = (n: number) => `Q${n.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;

  const buildFileName = () => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `CotizacionSweetCakes-${dd}${mm}${yy}.pdf`;
  };

  const obtenerLogoUriAsync = async (): Promise<string> => {
    try {
      const asset = Asset.fromModule(require('../../assets/images/logo.png'));
      if (!asset.downloaded) {
        await asset.downloadAsync();
      }
      // Web: asset.uri; Nativo: asset.localUri
      return (asset.localUri || asset.uri || '') as string;
    } catch {
      return '';
    }
  };

  const generarHTML = async () => {
    const logoUri = await obtenerLogoUriAsync();

    const rows = items.map((it, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${it.nombre}${it.descripcion ? `<div class="desc">${it.descripcion}</div>` : ''}</td>
        <td class="num">${it.cantidad}</td>
        <td class="num">${formatCurrency(it.precioUnit)}</td>
        <td class="num">${formatCurrency(it.cantidad * it.precioUnit)}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${buildFileName()}</title>
          <style>
            @page { margin: 24px; }
            body { font-family: 'Times New Roman', Times, serif; color: #333; }
            .header { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
            .logo { height: 64px; }
            .header-right { display: flex; flex-direction: column; gap: 4px; }
            .empresa { font-weight: bold; font-size: 20px; color: #5E336F; font-family: 'Times New Roman', Times, serif; }
            .title { font-size: 24px; font-weight: bold; color: #5E336F; margin-top: 8px; font-family: 'Times New Roman', Times, serif; }
            .meta { margin-top: 4px; font-size: 12px; color: #555; }
            .info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
            .info-box { border: 1px solid #ddd; border-radius: 8px; padding: 8px 12px; }
            .info-title { font-weight: bold; color: #5E336F; margin-bottom: 4px; font-family: 'Times New Roman', Times, serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 14px; }
            th { background: #F3E6FA; text-align: left; font-family: 'Times New Roman', Times, serif; }
            .num { text-align: right; white-space: nowrap; }
            .desc { color: #666; font-size: 12px; margin-top: 4px; }
            .totals { display: flex; justify-content: flex-end; margin-top: 12px; }
            .total-box { min-width: 260px; border: 1px solid #ddd; border-radius: 8px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #eee; }
            .total-row:last-child { border-bottom: none; font-weight: bold; }
            .notes { margin-top: 16px; font-size: 12px; color: #555; }
            .contact { margin-top: 8px; font-size: 12px; color: #555; text-align: center; }
            .footer { margin-top: 24px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoUri ? `<img class="logo" src="${logoUri}" />` : ''}
            <div class="header-right">
              <div class="empresa">${empresa.nombre}</div>
              ${empresa.direccion ? `<div class="meta">${empresa.direccion}</div>` : ''}
            </div>
          </div>
          <div class="title">Cotización</div>

          <div class="info">
            <div class="info-box">
              <div class="info-title">Cliente</div>
              <div><strong>${cliente || '-'}</strong></div>
            </div>
            <div class="info-box">
              <div class="info-title">Detalles</div>
              <div>Fecha: ${new Date().toLocaleDateString('es-ES')}</div>
              <div>Moneda: Q</div>
              <div>Validez: 15 días</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio Unit. (Q)</th>
                <th>Subtotal (Q)</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="5">Sin productos</td></tr>'}
            </tbody>
          </table>
          <div class="totals">
            <div class="total-box">
              <div class="total-row"><span>Subtotal</span><span>${formatCurrency(total)}</span></div>
              <div class="total-row"><span>Total</span><span>${formatCurrency(total)}</span></div>
            </div>
          </div>
          <div class="notes">Esta cotización es referencial y válida por 15 días. Precios en Quetzales (Q).</div>
          <div class="contact">${empresa.contacto ? `Atención: ${empresa.contacto}` : ''}${empresa.telefono ? `${empresa.contacto ? ' | ' : ''}Tel: ${empresa.telefono}` : ''}${empresa.email ? `${(empresa.contacto || empresa.telefono) ? ' | ' : ''}Email: ${empresa.email}` : ''}${empresa.direccion ? `${(empresa.contacto || empresa.telefono || empresa.email) ? ' | ' : ''}${empresa.direccion}` : ''}</div>
          <div class="footer">Gracias por su preferencia.</div>
        </body>
      </html>
    `;
    return html;
  };

  const handleGenerarPDF = async () => {
    if (!cliente.trim()) {
      Platform.OS === 'web' ? alert('Ingresa el nombre del cliente') : Alert.alert('Falta cliente', 'Ingresa el nombre del cliente');
      return;
    }
    if (items.length === 0) {
      Platform.OS === 'web' ? alert('Agrega al menos un producto') : Alert.alert('Faltan productos', 'Agrega al menos un producto');
      return;
    }
    const html = await generarHTML();
    try {
      if (Platform.OS === 'web') {
        const win = window.open('', '_blank');
        if (!win) {
          alert('Pop-up bloqueado. Permite ventanas emergentes.');
          return;
        }
        win.document.open();
        win.document.write(html);
        win.document.close();
        win.focus();
        win.print();
        return;
      }
      const { uri } = await Print.printToFileAsync({ html });
      const filename = buildFileName();

      if (Platform.OS === 'android') {
        try {
          const SAF = (FileSystem as any).StorageAccessFramework;
          if (SAF?.requestDirectoryPermissionsAsync) {
            const permissions = await SAF.requestDirectoryPermissionsAsync();
            if (permissions.granted) {
              const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
              const fileUri = await SAF.createFileAsync(
                permissions.directoryUri,
                filename,
                'application/pdf'
              );
              await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: 'base64' as any });
              Alert.alert('Éxito', `Guardado como ${filename}`);
              return;
            }
          }
        } catch (e) {
          console.log('SAF no disponible o cancelado, usando compartir:', e);
        }
      }

      // Fallback iOS / Android sin SAF: compartir/guardar manualmente
      const can = await Sharing.isAvailableAsync();
      if (can) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('PDF generado', uri);
      }
    } catch (e) {
      console.error(e);
      Platform.OS === 'web' ? alert('No se pudo generar el PDF') : Alert.alert('Error', 'No se pudo generar el PDF');
    }
  };

  const renderItem = ({ item }: { item: ItemCotizacion }) => (
    <View style={styles.itemRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemNombre}>{item.nombre}</Text>
        {item.descripcion ? <Text style={styles.itemDesc}>{item.descripcion}</Text> : null}
      </View>
      <Text style={styles.itemMeta}>x{item.cantidad}</Text>
      <Text style={styles.itemMeta}>{formatCurrency(item.precioUnit)}</Text>
      <Text style={[styles.itemMeta, styles.itemSubtotal]}>{formatCurrency(item.cantidad * item.precioUnit)}</Text>
      <TouchableOpacity style={styles.itemBtn} onPress={() => abrirEditar(item)}>
        <Text style={styles.itemBtnText}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.itemBtn, styles.itemBtnDelete]} onPress={() => eliminarItem(item.id)}>
        <Text style={styles.itemBtnText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cotizaciones</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Cliente *</Text>
        <TextInput
          style={styles.input}
          value={cliente}
          onChangeText={setCliente}
          placeholder="Nombre de persona o empresa"
          placeholderTextColor={Colors.light.inputText}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Productos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={abrirAgregar}>
          <Text style={styles.addBtnText}>+ Agregar producto</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(it) => String(it.id)}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay productos en la cotización</Text>}
        style={{ maxHeight: 260 }}
      />

      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleGenerarPDF}>
        <Text style={styles.primaryBtnText}>Generar Cotización (PDF)</Text>
      </TouchableOpacity>

      {/* Modal agregar/editar producto */}
      <Modal visible={showItemModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingItemId ? 'Editar producto' : 'Agregar producto'}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={itemNombre}
                onChangeText={setItemNombre}
                placeholder="Ej: Pastel 2 pisos"
                placeholderTextColor={Colors.light.inputText}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.half]}>
                <Text style={styles.label}>Cantidad</Text>
                <TextInput
                  style={styles.input}
                  value={itemCantidad}
                  onChangeText={(t) => {
                    const digits = (t || '').replace(/[^0-9]/g, '');
                    // Si queda vacío, forzar 1; si empieza con 0s, normalizar
                    const normalized = digits.replace(/^0+(\d)/, '$1');
                    setItemCantidad(normalized === '' ? '1' : normalized);
                  }}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={Colors.light.inputText}
                />
              </View>
              <View style={[styles.inputGroup, styles.half]}>
                <Text style={styles.label}>Precio Unitario *</Text>
                <TextInput
                  style={styles.input}
                  value={itemPrecioUnit}
                  onChangeText={(t) => {
                    // Permitir vacío, limpiar caracteres no numéricos, prevenir múltiples puntos
                    const val = (t ?? '').replace(/[^0-9.]/g, '');
                    const parts = val.split('.');
                    setItemPrecioUnit(parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val);
                  }}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={Colors.light.inputText}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={itemDescripcion}
                onChangeText={setItemDescripcion}
                placeholder="Detalles del producto"
                placeholderTextColor={Colors.light.inputText}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowItemModal(false); limpiarItemForm(); }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={guardarItem}>
                <Text style={styles.confirmBtnText}>{editingItemId ? 'Guardar' : 'Agregar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 8,
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: 'bold', color: Colors.light.titleColor, marginBottom: 8 },
  input: {
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.light.inputBackground,
    color: Colors.light.inputText,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.titleColor },
  addBtn: { backgroundColor: Colors.light.buttonSecondary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: Colors.light.buttonSecondaryText, fontWeight: 'bold' },
  emptyText: { color: Colors.light.inputText, textAlign: 'center', marginTop: 12 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    padding: 12,
    marginBottom: 8,
  },
  itemNombre: { fontSize: 16, fontWeight: 'bold', color: Colors.light.titleColor },
  itemDesc: { fontSize: 12, color: Colors.light.inputText },
  itemMeta: { width: 80, textAlign: 'right', color: Colors.light.titleColor },
  itemSubtotal: { fontWeight: 'bold' },
  itemBtn: { marginLeft: 8, backgroundColor: Colors.light.buttonSecondary, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 },
  itemBtnDelete: { backgroundColor: Colors.light.buttonPrimary },
  itemBtnText: { color: Colors.light.buttonText, fontWeight: 'bold' },
  totalBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: Colors.light.titleColor },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: Colors.light.buttonPrimary },
  primaryBtn: { backgroundColor: Colors.light.buttonPrimary, padding: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: Colors.light.buttonText, fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(94, 51, 111, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: Colors.light.background, borderRadius: 12, width: '100%', maxWidth: 520 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.light.titleColor, textAlign: 'center', marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: Colors.light.inputBorder },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 2, borderColor: Colors.light.inputBorder, alignItems: 'center' },
  cancelBtnText: { color: Colors.light.inputText, fontWeight: 'bold' },
  confirmBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: Colors.light.buttonPrimary, alignItems: 'center' },
  confirmBtnText: { color: Colors.light.buttonText, fontWeight: 'bold' },

  // Pantalla de acceso denegado
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 20,
  },
  accessDeniedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  accessDeniedText: {
    fontSize: 18,
    color: Colors.light.inputText,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  accessDeniedSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});


