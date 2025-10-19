import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import hybridDB from '../services/hybrid-db';
import Colors from '../constants/Colors';
import { useResponsive } from '../utils/responsive';

interface Producto {
  tipo: 'pastel' | 'cupcakes' | 'otros';
  sabor?: string;
  relleno?: string;
  tamaño?: string;
  cantidad?: number;
  esMinicupcake?: boolean;
  descripcion?: string;
}

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onAddProduct: (producto: Producto) => void;
}

export default function AddProductModal({ visible, onClose, onAddProduct }: AddProductModalProps) {
  const responsive = useResponsive();
  const btn = (s: 'small' | 'medium' | 'large') => (responsive.buttonStyles as any)(s);
  const [productoTipo, setProductoTipo] = useState<'pastel' | 'cupcakes' | 'otros'>('pastel');
  const [productoSabor, setProductoSabor] = useState('');
  const [productoRelleno, setProductoRelleno] = useState('');
  const [productoTamaño, setProductoTamaño] = useState('');
  const [productoCantidad, setProductoCantidad] = useState(1);
  const [productoDescripcion, setProductoDescripcion] = useState('');
  const [esMinicupcakes, setEsMinicupcakes] = useState(false);
  
  const [sabores, setSabores] = useState<any[]>([]);
  const [rellenos, setRellenos] = useState<any[]>([]);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (visible) {
      cargarDatos();
      resetForm();
    }
  }, [visible]);

  const cargarDatos = async () => {
    try {
      console.log('🔄 Cargando datos para modal...');
      await hybridDB.initialize();
      const [saboresData, rellenosData] = await Promise.all([
        hybridDB.obtenerSabores(),
        hybridDB.obtenerRellenos(),
      ]);
      setSabores(saboresData);
      setRellenos(rellenosData);
      console.log(`✅ Datos cargados: ${saboresData.length} sabores, ${rellenosData.length} rellenos`);
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    }
  };

  const resetForm = () => {
    setProductoTipo('pastel');
    setProductoSabor('');
    setProductoRelleno('');
    setProductoTamaño('');
    setProductoCantidad(1);
    setProductoDescripcion('');
    setEsMinicupcakes(false);
  };

  const handleAddProduct = () => {
    // Validaciones
    if (productoTipo !== 'otros' && !productoSabor) {
      alert('Por favor selecciona un sabor');
      return;
    }
    if (productoTipo === 'pastel' && !productoTamaño) {
      alert('Por favor ingresa el tamaño del pastel');
      return;
    }
    if (productoTipo === 'cupcakes' && productoCantidad <= 0) {
      alert('Por favor ingresa una cantidad válida');
      return;
    }

    const nuevoProducto: Producto = {
      tipo: productoTipo,
      ...(productoTipo !== 'otros' && { sabor: productoSabor }),
      ...(productoTipo !== 'otros' && productoRelleno && { relleno: productoRelleno }),
      ...(productoTipo === 'pastel' && { tamaño: productoTamaño }),
      ...(productoTipo === 'cupcakes' && { cantidad: productoCantidad }),
      ...(productoTipo === 'cupcakes' && { esMinicupcake: esMinicupcakes }),
      ...(productoDescripcion && { descripcion: productoDescripcion }),
    };

    onAddProduct(nuevoProducto);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
      hardwareAccelerated={true}
    >
      <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, responsive.modalStyles.container as any]}>
          <View style={[styles.modalHeader, responsive.modalStyles.header]}>
            <Text style={[styles.modalTitle, responsive.modalStyles.title]}>Agregar Producto</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={[styles.modalScrollView, responsive.modalStyles.body as any]}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >


            {/* 1. TIPO DE PRODUCTO */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>1. Tipo de Producto *</Text>
              <View style={styles.typeButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    productoTipo === 'pastel' && styles.typeButtonActive
                  ]}
                  onPress={() => {
                    setProductoTipo('pastel');
                    setProductoSabor('');
                    setProductoRelleno('');
                    setProductoTamaño('');
                  }}
                >
                  <Text style={[
                    styles.typeButtonText,
                    productoTipo === 'pastel' && styles.typeButtonTextActive
                  ]}>
                    🍰 Pastel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    productoTipo === 'cupcakes' && styles.typeButtonActive
                  ]}
                  onPress={() => {
                    setProductoTipo('cupcakes');
                    setProductoSabor('');
                    setProductoRelleno('');
                    setProductoCantidad(1);
                    setEsMinicupcakes(false);
                  }}
                >
                  <Text style={[
                    styles.typeButtonText,
                    productoTipo === 'cupcakes' && styles.typeButtonTextActive
                  ]}>
                    🧁 Cupcakes
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    productoTipo === 'otros' && styles.typeButtonActive
                  ]}
                  onPress={() => {
                    setProductoTipo('otros');
                    setProductoDescripcion('');
                  }}
                >
                  <Text style={[
                    styles.typeButtonText,
                    productoTipo === 'otros' && styles.typeButtonTextActive
                  ]}>
                    📦 Otros
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. SABOR (solo pastel y cupcakes) */}
            {productoTipo !== 'otros' && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>2. Sabor *</Text>
                <View style={[styles.optionsContainer, { 
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-start'
                }]}>
                  {sabores
                    .filter(sabor => sabor.tipo === productoTipo || sabor.tipo === 'todos')
                    .map((sabor) => (
                      <TouchableOpacity
                        key={sabor.id}
                        style={[
                          styles.optionButton,
                          (responsive.buttonStyles as any)(responsive.modalStyles.buttonGrid.buttonSize),
                          productoSabor === sabor.nombre && styles.optionButtonActive,
                          { 
                            width: responsive.modalStyles.buttonGrid.columns === 2 ? '48%' : '31%',
                            margin: responsive.modalStyles.buttonGrid.buttonMargin
                          }
                        ]}
                        onPress={() => setProductoSabor(sabor.nombre)}
                      >
                        <Text style={[
                          styles.optionButtonText,
                          productoSabor === sabor.nombre && styles.optionButtonTextActive,
                          { fontSize: responsive.isExtraSmallScreen ? 12 : responsive.isVerySmallScreen ? 13 : 14 }
                        ]}>
                          {sabor.nombre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
                
                {sabores.filter(sabor => sabor.tipo === productoTipo || sabor.tipo === 'todos').length === 0 && (
                  <Text style={styles.warningText}>⚠️ No hay sabores disponibles para {productoTipo}</Text>
                )}
              </View>
            )}

            {/* 3. RELLENO (solo pastel y cupcakes) */}
            {productoTipo !== 'otros' && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>3. Relleno</Text>
                <View style={[styles.optionsContainer, { 
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-start'
                }]}>
                  {rellenos
                    .filter(relleno => relleno.tipo === productoTipo || relleno.tipo === 'todos')
                    .map((relleno) => (
                      <TouchableOpacity
                        key={relleno.id}
                        style={[
                          styles.optionButton,
                          (responsive.buttonStyles as any)(responsive.modalStyles.buttonGrid.buttonSize),
                          productoRelleno === relleno.nombre && styles.optionButtonActive,
                          { 
                            width: responsive.modalStyles.buttonGrid.columns === 2 ? '48%' : '31%',
                            margin: responsive.modalStyles.buttonGrid.buttonMargin
                          }
                        ]}
                        onPress={() => setProductoRelleno(relleno.nombre)}
                      >
                        <Text style={[
                          styles.optionButtonText,
                          productoRelleno === relleno.nombre && styles.optionButtonTextActive,
                          { fontSize: responsive.isExtraSmallScreen ? 12 : responsive.isVerySmallScreen ? 13 : 14 }
                        ]}>
                          {relleno.nombre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
                
                {rellenos.filter(relleno => relleno.tipo === productoTipo || relleno.tipo === 'todos').length === 0 && (
                  <Text style={styles.warningText}>⚠️ No hay rellenos disponibles para {productoTipo}</Text>
                )}
              </View>
            )}

            {/* 4. TAMAÑO (solo pastel) */}
            {productoTipo === 'pastel' && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>4. Tamaño del Pastel *</Text>
                <TextInput
                  style={styles.textInput}
                  value={productoTamaño}
                  onChangeText={setProductoTamaño}
                  placeholder="Ej: 8 pulgadas, mediano, grande..."
                  placeholderTextColor="#999"
                />
              </View>
            )}

            {/* 5. CANTIDAD Y MINICUPCAKES (solo cupcakes) */}
            {productoTipo === 'cupcakes' && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>4. Cantidad de Cupcakes *</Text>
                <TextInput
                  style={styles.textInput}
                  value={productoCantidad.toString()}
                  onChangeText={(text) => setProductoCantidad(parseInt(text) || 1)}
                  placeholder="Ej: 12"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                
                <TouchableOpacity
                  style={[styles.checkboxButton, esMinicupcakes && styles.checkboxButtonActive]}
                  onPress={() => setEsMinicupcakes(!esMinicupcakes)}
                >
                  <Text style={[styles.checkboxButtonText, esMinicupcakes && styles.checkboxButtonTextActive]}>
                    {esMinicupcakes ? '✅' : '☐'} Es minicupcake
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 6. DESCRIPCIÓN (para todos) */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                {productoTipo === 'otros' ? '2' : productoTipo === 'pastel' ? '5' : '5'}. Descripción
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={productoDescripcion}
                onChangeText={setProductoDescripcion}
                placeholder="Descripción adicional del producto..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={[styles.modalButtons, responsive.modalStyles.buttons as any]}>
            <TouchableOpacity style={[styles.cancelButton, btn('medium' as 'medium')]} onPress={onClose}>
              <Text style={[styles.cancelButtonText, { fontSize: responsive.isExtraSmallScreen ? 14 : 16 }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addButton, btn('medium' as 'medium')]} onPress={handleAddProduct}>
              <Text style={[styles.addButtonText, { fontSize: responsive.isExtraSmallScreen ? 14 : 16 }]}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(94, 51, 111, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    width: '95%',
    maxWidth: 500,
    alignSelf: 'center',
    maxHeight: '85%',
    flex: 1,
  },
  modalBody: {
    flex: 1,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.cardBackground,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalScrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 10,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    margin: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  optionsContainer: {
    paddingBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    margin: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 120,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  optionButtonText: {
    fontSize: 12,
    color: '#666',
  },
  optionButtonTextActive: {
    color: 'white',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  checkboxButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  checkboxButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  checkboxButtonText: {
    fontSize: 14,
    color: '#666',
  },
  checkboxButtonTextActive: {
    color: 'white',
  },
  warningText: {
    fontSize: 12,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  addButton: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});
