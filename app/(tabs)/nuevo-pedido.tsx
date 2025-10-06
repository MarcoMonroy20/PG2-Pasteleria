import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { useDataRefresh } from '../../contexts/DataContext';
import hybridDB from '../../services/hybrid-db';
import { Sabor, Relleno } from '../../services/db';
import Colors from '../../constants/Colors';
import { scheduleMultiplePedidoNotifications } from '../../services/notifications';
import { setNotificationIdForPedido } from '../../services/db';
import AddProductModal from '../../components/AddProductModal';

interface Producto {
  tipo: 'pastel' | 'cupcakes' | 'otros';
  sabor?: string;
  relleno?: string;
  tamaño?: string;
  cantidad?: number;
  esMinicupcake?: boolean;
  descripcion?: string;
}

interface Settings {
  notifications_enabled?: boolean;
  notification_days?: number[];
  days_before?: number;
}

export default function NuevoPedidoScreen() {
  const navigation = useNavigation();
  const { triggerRefresh, refreshTrigger } = useDataRefresh();
  const { fechaSeleccionada } = useLocalSearchParams();
  
  // Estados principales
  const [nombrePedido, setNombrePedido] = useState('');
  const [precioTotal, setPrecioTotal] = useState('');
  const [precioAbonado, setPrecioAbonado] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [imagen, setImagen] = useState<string | null>(null);
  
  // Estados del modal
  const [modalVisible, setModalVisible] = useState(false);
  
  // Estados de datos
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [rellenos, setRellenos] = useState<Relleno[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  
  // Estados de fecha
  const [fechaEntrega, setFechaEntrega] = useState(new Date().toISOString().split('T')[0]);
  const [fechaEntregaDate, setFechaEntregaDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [refreshTrigger]);

  // Manejar fecha seleccionada desde calendario
  useEffect(() => {
    if (fechaSeleccionada && typeof fechaSeleccionada === 'string') {
      const fecha = new Date(fechaSeleccionada);
      setFechaEntrega(fechaSeleccionada);
      setFechaEntregaDate(fecha);
    }
  }, [fechaSeleccionada]);

  const cargarDatos = async () => {
    try {
      
      // Intentar sincronizar con Firebase primero
      try {
        if (hybridDB.isFirebaseEnabled()) {
          await hybridDB.syncFromCloud();
        }
      } catch (syncError) {
        // Fallback silencioso a datos locales
      }
      
      // Cargar datos locales
      const [saboresData, rellenosData, settingsData] = await Promise.all([
        hybridDB.obtenerSabores(),
        hybridDB.obtenerRellenos(),
        hybridDB.obtenerSettings(),
      ]);
      
      setSabores(saboresData);
      setRellenos(rellenosData);
      setSettings(settingsData);
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    }
  };

  const formatearPrecio = (valor: string) => {
    // Remover caracteres no numéricos excepto punto y coma
    let numero = valor.replace(/[^0-9.,]/g, '');
    
    // Reemplazar coma por punto
    numero = numero.replace(',', '.');
    
    // Asegurar que solo haya un punto decimal
    const partes = numero.split('.');
    if (partes.length > 2) {
      numero = partes[0] + '.' + partes.slice(1).join('');
    }
    
    return numero;
  };

  const handlePrecioChange = (valor: string, setter: (valor: string) => void) => {
    const formateado = formatearPrecio(valor);
    setter(formateado);
  };

  const abrirModalProducto = () => {
    setModalVisible(true);
  };

  const cerrarModalProducto = () => {
    setModalVisible(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFechaEntregaDate(selectedDate);
      setFechaEntrega(selectedDate.toISOString().split('T')[0]);
    }
  };

  const showDatePickerModal = () => {
    // Solo para Android/iOS
    setShowDatePicker(true);
  };


  const agregarProductoAlPedido = (nuevoProducto: Producto) => {
    setProductos([...productos, nuevoProducto]);
    
    if (Platform.OS === 'web') {
      alert('Producto Agregado');
    } else {
      Alert.alert('Éxito', 'Producto Agregado');
    }
  };

  const eliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index));
    if (Platform.OS === 'web') {
      alert('Producto Eliminado');
    } else {
      Alert.alert('Éxito', 'Producto Eliminado');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImagen(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImagen(null);
  };

  const guardarPedido = async () => {
    if (!nombrePedido.trim()) {
      if (Platform.OS === 'web') {
        alert('El nombre del pedido es obligatorio');
      } else {
        Alert.alert('Error', 'El nombre del pedido es obligatorio');
      }
      return;
    }

    if (!direccionEntrega.trim()) {
      if (Platform.OS === 'web') {
        alert('La dirección de entrega es obligatoria');
      } else {
        Alert.alert('Error', 'La dirección de entrega es obligatoria');
      }
      return;
    }

    if (productos.length === 0) {
      if (Platform.OS === 'web') {
        alert('Debe agregar al menos un producto');
      } else {
        Alert.alert('Error', 'Debe agregar al menos un producto');
      }
      return;
    }

    try {
      const pedidoData = {
        nombre: nombrePedido,
        precio_total: parseFloat(precioTotal) || 0,
        precio_final: parseFloat(precioTotal) || 0,
        precio_abonado: parseFloat(precioAbonado) || 0,
        monto_abonado: parseFloat(precioAbonado) || 0,
        descripcion: descripcion,
        fecha_entrega: fechaEntrega,
        direccion_entrega: direccionEntrega,
        productos: productos,
        imagen: imagen || undefined,
        fecha_creacion: new Date().toISOString(),
      };

      const pedidoId = await hybridDB.crearPedido(pedidoData);

      // 🔔 Programar notificaciones según configuración
      try {
        if (settings?.notifications_enabled) {
          const notificationDays = settings.notification_days || [0];
          
          // Programar múltiples notificaciones usando la nueva función
          const scheduledIds = await scheduleMultiplePedidoNotifications(
            pedidoId,
            nombrePedido,
            fechaEntrega,
            notificationDays
          );
          
          // Guardar el ID de la primera notificación (para compatibilidad)
          if (scheduledIds.length > 0) {
            await setNotificationIdForPedido(pedidoId, scheduledIds[0]);
          }
        }
      } catch (notificationError) {
        console.error('❌ Error programando notificaciones:', notificationError);
        // No fallar el guardado del pedido por error en notificaciones
      }

      // Limpiar formulario
      setNombrePedido('');
      setPrecioTotal('');
      setPrecioAbonado('');
      setDescripcion('');
      setDireccionEntrega('');
      setProductos([]);
      setImagen(null);
      const today = new Date();
      setFechaEntregaDate(today);
      setFechaEntrega(today.toISOString().split('T')[0]);

      // Trigger refresh para actualizar otras pantallas
      triggerRefresh();

      if (Platform.OS === 'web') {
        alert('Pedido guardado exitosamente');
      } else {
        Alert.alert('Éxito', 'Pedido guardado exitosamente');
      }

      // Navegar de vuelta
      navigation.goBack();
    } catch (error) {
      console.error('❌ Error guardando pedido:', error);
      if (Platform.OS === 'web') {
        alert('Error al guardar el pedido');
      } else {
        Alert.alert('Error', 'Error al guardar el pedido');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nuevo Pedido</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Fecha de Entrega *</Text>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={fechaEntregaDate.toISOString().split('T')[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                setFechaEntregaDate(newDate);
                setFechaEntrega(e.target.value);
              }}
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '12px',
                backgroundColor: 'white',
                color: '#374151',
                boxSizing: 'border-box',
                minHeight: '48px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                outline: 'none',
              }}
            />
          ) : (
            <TouchableOpacity
              style={styles.input}
              onPress={showDatePickerModal}
            >
              <Text style={styles.datePickerText}>
                {fechaEntregaDate.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>Nombre del Pedido *</Text>
          <TextInput
            style={styles.input}
            value={nombrePedido}
            onChangeText={setNombrePedido}
            placeholder="Ej: Pastel de Cumpleaños"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Precio Total</Text>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencySymbol}>Q</Text>
            <TextInput
              style={styles.priceInput}
              value={precioTotal}
              onChangeText={(text) => handlePrecioChange(text, setPrecioTotal)}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>

          <Text style={styles.label}>Monto Abonado</Text>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencySymbol}>Q</Text>
            <TextInput
              style={styles.priceInput}
              value={precioAbonado}
              onChangeText={(text) => handlePrecioChange(text, setPrecioAbonado)}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Descripción adicional del pedido..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Dirección de Entrega *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={direccionEntrega}
            onChangeText={setDireccionEntrega}
            placeholder="Dirección completa de entrega"
            placeholderTextColor="#999"
            multiline
            numberOfLines={2}
          />

          {/* Campo de imagen */}
          <Text style={styles.label}>Imagen del Pedido</Text>
          <View style={styles.imageContainer}>
            {imagen ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: imagen }} style={styles.image} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                <Text style={styles.addImageText}>+ Agregar Imagen</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.label}>Productos</Text>
          {productos.map((producto, index) => (
            <View key={index} style={styles.productoItem}>
              <View style={styles.productoInfo}>
                <Text style={styles.productoTexto}>
                  {producto.tipo} - {producto.sabor}
                  {producto.relleno && ` con ${producto.relleno}`}
                  {producto.tamaño && ` (${producto.tamaño})`}
                  {producto.cantidad && producto.cantidad > 1 && ` x${producto.cantidad}`}
                  {producto.esMinicupcake && ` (Minicupcakes)`}
                  {producto.descripcion && ` - ${producto.descripcion}`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.eliminarBtn}
                onPress={() => eliminarProducto(index)}
              >
                <Text style={styles.eliminarBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.agregarBtn} onPress={abrirModalProducto}>
            <Text style={styles.agregarBtnText}>+ Agregar Producto</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.guardarBtn} onPress={guardarPedido}>
          <Text style={styles.guardarBtnText}>Guardar Pedido</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Agregar Producto - NUEVO COMPONENTE */}
      <AddProductModal
        visible={modalVisible}
        onClose={cerrarModalProducto}
        onAddProduct={agregarProductoAlPedido}
      />

      {/* DateTimePicker solo para Android/iOS */}
      {showDatePicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={fechaEntregaDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: Colors.light.cardBackground,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 18,
    color: Colors.light.buttonPrimary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  formContainer: {
    paddingVertical: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: Colors.light.text,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: Colors.light.text,
    flex: 1,
  },
  dateButtonIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  datePickerText: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'left',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '600',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  // Estilos para el campo de imagen
  imageContainer: {
    marginTop: 8,
  },
  addImageBtn: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: 16,
    color: Colors.light.buttonPrimary,
    fontWeight: '500',
  },
  imagePreview: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos para productos
  productoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  productoInfo: {
    flex: 1,
    marginRight: 12,
  },
  productoTexto: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  eliminarBtn: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  eliminarBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  agregarBtn: {
    backgroundColor: Colors.light.buttonPrimary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  agregarBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guardarBtn: {
    backgroundColor: Colors.light.buttonPrimary,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  guardarBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
