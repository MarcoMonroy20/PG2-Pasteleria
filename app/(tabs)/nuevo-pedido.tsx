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
  Modal,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from 'expo-router';
import { useDataRefresh } from '../../contexts/DataContext';
import hybridDB from '../../services/hybrid-db';
import { Sabor, Relleno, Settings } from '../../services/db';
import Colors from '../../constants/Colors';

interface Producto {
  tipo: 'pastel' | 'cupcakes' | 'otros';
  sabor?: string;
  relleno?: string;
  tamaño?: string;
  cantidad?: number;
  esMinicupcake?: boolean;
  descripcion?: string;
}

export default function NuevoPedidoScreen() {
  const navigation = useNavigation();
  const { triggerRefresh, refreshTrigger } = useDataRefresh();
  
  // Estados principales
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [fechaEntregaDate, setFechaEntregaDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nombrePedido, setNombrePedido] = useState('');
  const [precioFinal, setPrecioFinal] = useState('');
  const [montoAbonado, setMontoAbonado] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [imagen, setImagen] = useState<string | null>(null);
  
  // Estados del modal
  const [modalVisible, setModalVisible] = useState(false);
  const [productoTipo, setProductoTipo] = useState<'pastel' | 'cupcakes' | 'otros'>('pastel');
  const [productoSabor, setProductoSabor] = useState('');
  const [productoRelleno, setProductoRelleno] = useState('');
  const [productoTamaño, setProductoTamaño] = useState('');
  const [productoCantidad, setProductoCantidad] = useState(1);
  const [productoDescripcion, setProductoDescripcion] = useState('');
  const [esMinicupcakes, setEsMinicupcakes] = useState(false);
  
  // Estados de datos
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [rellenos, setRellenos] = useState<Relleno[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  // Configurar fecha por defecto (mañana)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFechaEntregaDate(tomorrow);
    setFechaEntrega(formatearFecha(tomorrow));
  }, []);

  // Cargar datos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        await hybridDB.initialize();
        
        // Sync with Firebase first (Firebase is source of truth)
        if (hybridDB.isFirebaseEnabled()) {
          await hybridDB.syncFromCloud();
        }
        
        // Read data using hybrid DB functions (works on both web and native)
        const [saboresData, rellenosData] = await Promise.all([
          hybridDB.obtenerSabores(),
          hybridDB.obtenerRellenos(),
        ]);
        
        const settingsData = await hybridDB.obtenerSettings();
        
        setSabores(saboresData);
        setRellenos(rellenosData);
        setSettings(settingsData);
      } catch (error) {
        console.error('❌ Error cargando datos:', error);
      }
    };
    cargarDatos();
  }, []);

  // Funciones para manejo de imágenes
  const pickImage = async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos para acceder a la galería');
        return;
      }

      // Abrir directamente el selector de imágenes (galería)
      pickFromGallery();
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'No se pudieron solicitar los permisos: ' + (error as Error).message);
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImagen(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      if (Platform.OS === 'web') {
        alert('Error: No se pudo seleccionar la imagen');
      } else {
        Alert.alert('Error', 'No se pudo seleccionar la imagen');
      }
    }
  };


  const removeImage = () => {
    Alert.alert(
      'Eliminar Imagen',
      '¿Estás seguro de que quieres eliminar la imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => setImagen(null) }
      ]
    );
  };

  // Recargar sabores y rellenos cuando cambie el refreshTrigger
  useEffect(() => {
    const recargarSaboresYRellenos = async () => {
      try {
        // Sync with Firebase first (Firebase is source of truth)
        if (hybridDB.isFirebaseEnabled()) {
          await hybridDB.syncFromCloud();
        }
        
        // Read data using hybrid DB functions (works on both web and native)
        const [saboresData, rellenosData] = await Promise.all([
          hybridDB.obtenerSabores(),
          hybridDB.obtenerRellenos(),
        ]);
        
        setSabores(saboresData);
        setRellenos(rellenosData);
      } catch (error) {
        console.error('Error recargando sabores y rellenos:', error);
      }
    };
    
    if (refreshTrigger > 0) {
      recargarSaboresYRellenos();
    }
  }, [refreshTrigger]);

  // Estilos CSS adicionales para el selector de fecha en web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        .date-picker-input {
          width: 100% !important;
          box-sizing: border-box !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          appearance: none !important;
        }
        
        .date-picker-input::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
        
        .date-picker-input::-webkit-inner-spin-button,
        .date-picker-input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .date-picker-input {
            font-size: 14px !important;
            padding: 10px 12px !important;
            min-height: 44px !important;
          }
        }
        
        @media (max-width: 480px) {
          .date-picker-input {
            font-size: 13px !important;
            padding: 8px 10px !important;
            min-height: 40px !important;
          }
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        // Cleanup: remover el estilo cuando el componente se desmonte
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
  }, []);

  const formatearFecha = (fecha: Date) => {
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearPrecio = (valor: string) => {
    // Remover todo excepto números y un punto decimal
    const numerico = valor.replace(/[^0-9.]/g, '');
    const partes = numerico.split('.');
    if (partes.length > 2) {
      return partes[0] + '.' + partes.slice(1).join('');
    }
    return numerico;
  };

  const handlePrecioChange = (valor: string, setter: (valor: string) => void) => {
    const formateado = formatearPrecio(valor);
    setter(formateado);
  };

  const abrirModalProducto = async () => {
    // Forzar recarga de datos antes de abrir el modal
    try {
      if (hybridDB.isFirebaseEnabled()) {
        await hybridDB.syncFromCloud();
      }
      
      // Recargar datos
      const [saboresData, rellenosData] = await Promise.all([
        hybridDB.obtenerSabores(),
        hybridDB.obtenerRellenos(),
      ]);
      
      setSabores(saboresData);
      setRellenos(rellenosData);
    } catch (error) {
      console.error('❌ Error recargando datos para modal:', error);
    }
    
    setModalVisible(true);
    setProductoTipo('pastel');
    setProductoSabor(''); // Limpiar sabor seleccionado
    setProductoRelleno('');
    setProductoTamaño('');
    setProductoCantidad(1);
    setProductoDescripcion('');
    setEsMinicupcakes(false);
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

  const openDatePicker = () => {
    if (Platform.OS === 'web') {
      // Para web, usar el input HTML
      const input = document.createElement('input');
      input.type = 'date';
      input.min = new Date().toISOString().split('T')[0];
      input.value = fechaEntregaDate.toISOString().split('T')[0];
      
      input.onchange = (e: any) => {
        const newDate = new Date(e.target.value);
        setFechaEntregaDate(newDate);
        setFechaEntrega(e.target.value);
      };
      
      input.click();
    } else {
      // Para móvil, usar DateTimePicker
      setShowDatePicker(true);
    }
  };

  const agregarProductoAlPedido = () => {
    if (productoTipo !== 'otros' && !productoSabor) {
      if (Platform.OS === 'web') {
        alert('Por favor selecciona un sabor');
      } else {
        Alert.alert('Error', 'Por favor selecciona un sabor');
      }
      return;
    }

    if (productoTipo === 'pastel' && !productoTamaño) {
      if (Platform.OS === 'web') {
        alert('Por favor ingresa el tamaño del pastel');
      } else {
        Alert.alert('Error', 'Por favor ingresa el tamaño del pastel');
      }
      return;
    }

    if (productoTipo === 'cupcakes' && productoCantidad <= 0) {
      if (Platform.OS === 'web') {
        alert('Por favor ingresa una cantidad válida');
      } else {
        Alert.alert('Error', 'Por favor ingresa una cantidad válida');
      }
      return;
    }

    if (productoTipo === 'otros' && !productoDescripcion.trim()) {
      if (Platform.OS === 'web') {
        alert('Por favor ingresa una descripción');
      } else {
        Alert.alert('Error', 'Por favor ingresa una descripción');
      }
      return;
    }

    const nuevoProducto: Producto = {
      tipo: productoTipo,
      cantidad: productoCantidad,
      esMinicupcake: esMinicupcakes,
      ...(productoTipo !== 'otros' && { sabor: productoSabor }),
      ...(productoTipo !== 'otros' && { relleno: productoRelleno }),
      ...(productoTipo === 'pastel' && { tamaño: productoTamaño }),
      ...(productoTipo === 'otros' && { descripcion: productoDescripcion }),
    };

    setProductos([...productos, nuevoProducto]);
    cerrarModalProducto();

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

  const guardarPedido = async () => {
    console.log('🔍 Iniciando guardarPedido...');

    if (!fechaEntrega) {
      if (Platform.OS === 'web') {
        alert('Por favor selecciona una fecha de entrega');
      } else {
        Alert.alert('Error', 'Por favor selecciona una fecha de entrega');
      }
      return;
    }

    if (!nombrePedido.trim()) {
      if (Platform.OS === 'web') {
        alert('Por favor ingresa el nombre del pedido');
      } else {
        Alert.alert('Error', 'Por favor ingresa el nombre del pedido');
      }
      return;
    }

    if (!direccionEntrega.trim()) {
      if (Platform.OS === 'web') {
        alert('Por favor ingresa la dirección de entrega');
      } else {
        Alert.alert('Error', 'Por favor ingresa la dirección de entrega');
      }
      return;
    }

    if (!precioFinal || parseFloat(precioFinal) <= 0) {
      if (Platform.OS === 'web') {
        alert('Por favor ingresa un precio final válido');
      } else {
        Alert.alert('Error', 'Por favor ingresa un precio final válido');
      }
      return;
    }

    if (productos.length === 0) {
      if (Platform.OS === 'web') {
        alert('Por favor agrega al menos un producto');
      } else {
        Alert.alert('Error', 'Por favor agrega al menos un producto');
      }
      return;
    }

    try {
      const nuevoPedido = {
        fecha_entrega: fechaEntregaDate.toISOString().split('T')[0],
        nombre: nombrePedido,
        precio_final: parseFloat(precioFinal),
        monto_abonado: parseFloat(montoAbonado) || 0,
        descripcion: descripcion,
        direccion_entrega: direccionEntrega,
        productos: productos,
        imagen: imagen || undefined // Opcional: solo incluir si hay imagen
      };

      console.log('📝 Guardando pedido:', nuevoPedido);
      await hybridDB.crearPedido(nuevoPedido);
      
      console.log('✅ Pedido guardado exitosamente');
      
      if (Platform.OS === 'web') {
        alert('Pedido Guardado con Éxito');
      } else {
        Alert.alert('Éxito', 'Pedido Guardado con Éxito');
      }

      // Limpiar formulario
      setFechaEntrega('');
      setFechaEntregaDate(new Date());
      setNombrePedido('');
      setPrecioFinal('');
      setMontoAbonado('');
      setDescripcion('');
      setDireccionEntrega('');
      setProductos([]);
      setImagen(null);

      // Notificar a otros componentes
      triggerRefresh();

      // Regresar a la pantalla anterior
      navigation.goBack();

    } catch (error) {
      console.error('❌ Error guardando pedido:', error);
      if (Platform.OS === 'web') {
        alert('Error al Guardar');
      } else {
        Alert.alert('Error', 'Error al Guardar');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
      <Text style={styles.title}>Nuevo Pedido</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha de Entrega *</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={fechaEntregaDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  setFechaEntregaDate(newDate);
                  setFechaEntrega(formatearFecha(newDate));
                }}
                min={new Date().toISOString().split('T')[0]}
                className="date-picker-input"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: 'none',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  color: '#374151',
                  boxSizing: 'border-box',
                  minHeight: '48px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : 'default',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                  e.target.style.borderColor = '#F472B6';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.target.style.borderColor = 'transparent';
                }}
              />
            ) : (
              <TouchableOpacity
                style={styles.input}
                onPress={openDatePicker}
              >
                <Text style={styles.datePickerText}>
                  {fechaEntrega || 'Seleccionar fecha de entrega'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Pedido *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa el nombre del pedido"
              value={nombrePedido}
              onChangeText={setNombrePedido}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Precio Final *</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>Q</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                value={precioFinal}
                onChangeText={(valor) => handlePrecioChange(valor, setPrecioFinal)}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monto Abonado</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>Q</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                value={montoAbonado}
                onChangeText={(valor) => handlePrecioChange(valor, setMontoAbonado)}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descripción adicional del pedido"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dirección de Entrega *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Dirección completa donde se entregará el pedido"
              value={direccionEntrega}
              onChangeText={setDireccionEntrega}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Campo de Imagen - Opcional */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Imagen de Referencia (Opcional)</Text>
            <View style={styles.imageContainer}>
              {imagen ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: imagen }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.addImageBtn, { backgroundColor: '#E75480' }]} 
                  onPress={pickImage}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.addImageText, { color: 'white' }]}>📁 Seleccionar Imagen</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.sectionTitle}>Productos</Text>
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
        </View>
      </ScrollView>

      {/* Modal Agregar Producto */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={cerrarModalProducto}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Agregar Producto</Text>
            
            <ScrollView style={styles.modalScrollView}>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.pillButton, productoTipo === 'pastel' && styles.pillButtonActive]}
                  onPress={() => {
                    setProductoTipo('pastel');
                    setProductoSabor(''); // Limpiar sabor al cambiar tipo
                  }}
                >
                  <Text style={[styles.pillButtonText, productoTipo === 'pastel' && styles.pillButtonTextActive]}>
                    Pastel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pillButton, productoTipo === 'cupcakes' && styles.pillButtonActive]}
                  onPress={() => {
                    setProductoTipo('cupcakes');
                    setProductoSabor(''); // Limpiar sabor al cambiar tipo
                  }}
                >
                  <Text style={[styles.pillButtonText, productoTipo === 'cupcakes' && styles.pillButtonTextActive]}>
                    Cupcakes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pillButton, productoTipo === 'otros' && styles.pillButtonActive]}
                  onPress={() => {
                    setProductoTipo('otros');
                    setProductoSabor(''); // Limpiar sabor al cambiar tipo
                    setProductoRelleno(''); // Limpiar relleno al cambiar tipo
                  }}
                >
                  <Text style={[styles.pillButtonText, productoTipo === 'otros' && styles.pillButtonTextActive]}>
                    Otros
                  </Text>
                </TouchableOpacity>
              </View>

              {productoTipo !== 'otros' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Sabor *</Text>
                  <View style={styles.buttonGrid}>
                    {sabores
                      .filter(sabor => {
                        // Filtrar sabores según el tipo de producto
                        if (productoTipo === 'pastel') {
                          return sabor.tipo === 'pastel';
                        } else if (productoTipo === 'cupcakes') {
                          return sabor.tipo === 'cupcakes';
                        } else {
                          return true;
                        }
                      })
                      .map((sabor) => (
                        <TouchableOpacity
                          key={sabor.id}
                          style={[styles.pillButton, productoSabor === sabor.nombre && styles.pillButtonActive]}
                          onPress={() => setProductoSabor(sabor.nombre)}
                        >
                          <Text style={[styles.pillButtonText, productoSabor === sabor.nombre && styles.pillButtonTextActive]}>
                            {sabor.nombre}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    {sabores.filter(sabor => {
                      if (productoTipo === 'pastel') {
                        return sabor.tipo === 'pastel';
                      } else if (productoTipo === 'cupcakes') {
                        return sabor.tipo === 'cupcakes';
                      } else {
                        return true;
                      }
                    }).length === 0 && (
                      <Text style={{color: 'red', fontSize: 12, marginTop: 10}}>
                        No hay sabores disponibles para {productoTipo}. Ve a "Sabores y Rellenos" para agregar algunos.
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {productoTipo !== 'otros' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Relleno</Text>
                  <View style={styles.buttonGrid}>
                    {rellenos.map((relleno) => (
                      <TouchableOpacity
                        key={relleno.id}
                        style={[styles.pillButton, productoRelleno === relleno.nombre && styles.pillButtonActive]}
                        onPress={() => setProductoRelleno(relleno.nombre)}
                      >
                        <Text style={[styles.pillButtonText, productoRelleno === relleno.nombre && styles.pillButtonTextActive]}>
                          {relleno.nombre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {rellenos.length === 0 && (
                      <Text style={{color: 'red', fontSize: 12, marginTop: 10}}>
                        No hay rellenos disponibles. Ve a "Sabores y Rellenos" para agregar algunos.
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {productoTipo === 'pastel' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tamaño *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Grande, Mediano, Pequeño"
                    value={productoTamaño}
                    onChangeText={setProductoTamaño}
                  />
                </View>
              )}

              {productoTipo === 'cupcakes' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Cantidad *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Número de cupcakes"
                      value={productoCantidad.toString()}
                      onChangeText={(text) => setProductoCantidad(parseInt(text) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.minicupcakesButton, esMinicupcakes && styles.minicupcakesButtonActive]}
                    onPress={() => setEsMinicupcakes(!esMinicupcakes)}
                  >
                    <Text style={[styles.minicupcakesButtonText, esMinicupcakes && styles.minicupcakesButtonTextActive]}>
                      {esMinicupcakes ? '✓ Minicupcakes' : 'Minicupcakes'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {productoTipo === 'otros' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Descripción *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe el producto"
                    value={productoDescripcion}
                    onChangeText={setProductoDescripcion}
                    multiline
                    numberOfLines={2}
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={cerrarModalProducto}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={agregarProductoAlPedido}>
                <Text style={styles.addButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DateTimePicker para móvil */}
      {showDatePicker && (
        <DateTimePicker
          value={fechaEntregaDate}
          mode="date"
          display="default"
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
  },
  scrollContent: {
    paddingBottom: 50,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: 'white',
    color: Colors.light.text,
  },
  inputText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  inputTextFilled: {
    color: Colors.light.text,
  },
  inputTextPlaceholder: {
    color: '#9CA3AF',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    backgroundColor: 'white',
    paddingLeft: 15,
  },
  currencySymbol: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '600',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: Colors.light.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 15,
  },
  productoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  productoInfo: {
    flex: 1,
  },
  productoTexto: {
    fontSize: 14,
    color: Colors.light.text,
  },
  eliminarBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  eliminarBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  agregarBtn: {
    backgroundColor: Colors.light.buttonPrimary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  agregarBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  guardarBtn: {
    backgroundColor: Colors.light.buttonPrimary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    zIndex: 1000,
    minHeight: 60,
  },
  guardarBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    padding: 20,
    width: '95%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalScrollView: {
    flex: 1,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
    marginHorizontal: -4,
  },
  pillButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: 'white',
    marginHorizontal: 4,
    marginVertical: 2,
    minWidth: 60,
    alignItems: 'center',
  },
  pillButtonActive: {
    backgroundColor: Colors.light.buttonPrimary,
    borderColor: Colors.light.buttonPrimary,
  },
  pillButtonText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  pillButtonTextActive: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: 'white',
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: Colors.light.buttonPrimary,
    alignItems: 'center',
    marginLeft: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  minicupcakesButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.buttonPrimary,
    backgroundColor: 'white',
    alignItems: 'center',
    marginTop: 10,
  },
  minicupcakesButtonActive: {
    backgroundColor: Colors.light.buttonPrimary,
    borderColor: Colors.light.buttonPrimary,
  },
  minicupcakesButtonText: {
    color: Colors.light.buttonPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  minicupcakesButtonTextActive: {
    color: 'white',
  },
  datePickerText: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'left',
  },
  // Estilos para el campo de imagen
  imageContainer: {
    marginTop: 8,
  },
  addImageBtn: {
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.light.border,
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
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
});
