import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Switch,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from 'expo-router';
import { useDataRefresh } from '../../contexts/DataContext';
import hybridDB from '../../services/hybrid-db';
import { Sabor, Relleno } from '../../services/db';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';

export default function RellenosMasasScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const { triggerRefresh } = useDataRefresh();
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [rellenos, setRellenos] = useState<Relleno[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sabores' | 'rellenos'>('sabores');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Sabor | Relleno | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'pastel' as 'pastel' | 'cupcakes',
    activo: true,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  // Recargar datos cuando la pantalla se enfoque
  useFocusEffect(
    React.useCallback(() => {
      cargarDatos();
    }, [])
  );

  const cargarDatos = async () => {
    try {
      await hybridDB.initialize();
      
        // Sync with Firebase first (Firebase is source of truth)
        if (hybridDB.isFirebaseEnabled()) {
          await hybridDB.syncFromCloud();
        }
      
      // Read data directly from localStorage after sync (bypass cache)
      let saboresData, rellenosData;
      
      if (Platform.OS === 'web') {
        // Read directly from localStorage to ensure we get updated data
        const saboresJson = localStorage.getItem('pasteleria_sabores') || '[]';
        const rellenosJson = localStorage.getItem('pasteleria_rellenos') || '[]';
        
        saboresData = JSON.parse(saboresJson);
        rellenosData = JSON.parse(rellenosJson);
        
      } else {
        // For native, use the hybrid DB functions
        [saboresData, rellenosData] = await Promise.all([
          hybridDB.obtenerSabores(),
          hybridDB.obtenerRellenos(),
        ]);
      }
      setSabores(saboresData);
      setRellenos(rellenosData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAgregar = () => {
    setEditingItem(null);
    setFormData({
      nombre: '',
      tipo: 'pastel',
      activo: true,
    });
    setShowModal(true);
  };

  const handleEditar = (item: Sabor | Relleno) => {
    console.log('✏️ Editando elemento:', item);
    setEditingItem(item);
    setFormData({
      nombre: item.nombre,
      tipo: 'tipo' in item ? (item.tipo || 'pastel') : 'pastel',
      activo: item.activo,
    });
    setShowModal(true);
  };

  const handleGuardar = async () => {
    if (!formData.nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    try {
      console.log('💾 Guardando elemento:', { activeTab, editingItem, formData });
      
      if (activeTab === 'sabores') {
        if (editingItem) {
          console.log('🔄 Actualizando sabor:', editingItem.id);
          await hybridDB.actualizarSabor(editingItem.id!, {
            nombre: formData.nombre,
            tipo: formData.tipo,
            activo: formData.activo,
          });
        } else {
          console.log('➕ Creando nuevo sabor');
          await hybridDB.crearSabor({
            nombre: formData.nombre,
            tipo: formData.tipo,
            activo: formData.activo,
          });
        }
      } else {
        if (editingItem) {
          console.log('🔄 Actualizando relleno:', editingItem.id);
          await hybridDB.actualizarRelleno(editingItem.id!, {
            nombre: formData.nombre,
            tipo: formData.tipo,
            activo: formData.activo,
          });
        } else {
          console.log('➕ Creando nuevo relleno');
          await hybridDB.crearRelleno({
            nombre: formData.nombre,
            tipo: formData.tipo,
            activo: formData.activo,
          });
        }
      }

      await cargarDatos();
      triggerRefresh(); // Notificar a otros componentes
      setShowModal(false);
      setEditingItem(null);
      Alert.alert('Éxito', 'Elemento guardado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el elemento');
      console.error('❌ Error guardando elemento:', error);
    }
  };

  const handleEliminar = (item: Sabor | Relleno) => {
    const eliminarElemento = async () => {
      try {
        if (activeTab === 'sabores') {
          await hybridDB.eliminarSabor(item.id!);
        } else {
          await hybridDB.eliminarRelleno(item.id!);
        }
        await cargarDatos();
        triggerRefresh(); // Notificar a otros componentes
        
        // Mostrar mensaje de éxito
        if (Platform.OS === 'web') {
          alert('Elemento eliminado correctamente');
        } else {
          Alert.alert('Éxito', 'Elemento eliminado correctamente');
        }
      } catch (error) {
        console.error(error);
        if (Platform.OS === 'web') {
          alert('Error: No se pudo eliminar el elemento');
        } else {
          Alert.alert('Error', 'No se pudo eliminar el elemento');
        }
      }
    };

    // Usar confirm nativo del navegador para web
    if (Platform.OS === 'web') {
      const confirmado = window.confirm(`¿Estás seguro de que quieres eliminar "${item.nombre}"?`);
      if (confirmado) {
        eliminarElemento();
      }
    } else {
      // Usar Alert para móvil
      Alert.alert(
        'Confirmar eliminación',
        `¿Estás seguro de que quieres eliminar "${item.nombre}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: eliminarElemento,
          },
        ]
      );
    }
  };

  const renderSabor = ({ item }: { item: Sabor }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNombre}>{item.nombre}</Text>
        <Text style={styles.itemTipo}>{item.tipo.toUpperCase()}</Text>
        <View style={styles.itemStatus}>
          <Text style={styles.statusLabel}>Activo:</Text>
          <Text style={[styles.statusValue, item.activo ? styles.activo : styles.inactivo]}>
            {item.activo ? 'Sí' : 'No'}
          </Text>
        </View>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => handleEditar(item)}
        >
          <Text style={styles.editBtnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleEliminar(item)}
        >
          <Text style={styles.deleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRelleno = ({ item }: { item: Relleno }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNombre}>{item.nombre}</Text>
        <Text style={styles.itemTipo}>{(item.tipo || 'pastel').toUpperCase()}</Text>
        <View style={styles.itemStatus}>
          <Text style={styles.statusLabel}>Activo:</Text>
          <Text style={[styles.statusValue, item.activo ? styles.activo : styles.inactivo]}>
            {item.activo ? 'Sí' : 'No'}
          </Text>
        </View>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => handleEditar(item)}
        >
          <Text style={styles.editBtnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleEliminar(item)}
        >
          <Text style={styles.deleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Rellenos y Masas</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sabores' && styles.activeTab]}
          onPress={() => setActiveTab('sabores')}
        >
          <Text style={[styles.tabText, activeTab === 'sabores' && styles.activeTabText]}>
            Sabores
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rellenos' && styles.activeTab]}
          onPress={() => setActiveTab('rellenos')}
        >
          <Text style={[styles.tabText, activeTab === 'rellenos' && styles.activeTabText]}>
            Rellenos
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.headerActions}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'sabores' ? 'Sabores Disponibles' : 'Rellenos Disponibles'}
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAgregar}>
            <Text style={styles.addButtonText}>+ Agregar</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'sabores' ? (
          <FlatList
            data={sabores}
            renderItem={renderSabor}
            keyExtractor={(item) => item.id!.toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay sabores registrados</Text>
            }
          />
        ) : (
          <FlatList
            data={rellenos}
            renderItem={renderRelleno}
            keyExtractor={(item) => item.id!.toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay rellenos registrados</Text>
            }
          />
        )}
      </View>

      {/* Modal para agregar/editar */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Editar' : 'Agregar'} {activeTab === 'sabores' ? 'Sabor' : 'Relleno'}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={formData.nombre}
                onChangeText={(text) => setFormData({...formData, nombre: text})}
                placeholder={`Nombre del ${activeTab === 'sabores' ? 'sabor' : 'relleno'}`}
                placeholderTextColor={Colors.light.inputText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo</Text>
              <View style={styles.tipoButtons}>
                {['pastel', 'cupcakes'].map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[
                      styles.tipoButton,
                      formData.tipo === tipo && styles.tipoButtonActive
                    ]}
                    onPress={() => setFormData({...formData, tipo: tipo as 'pastel' | 'cupcakes'})}
                  >
                    <Text style={[
                      styles.tipoButtonText,
                      formData.tipo === tipo && styles.tipoButtonTextActive
                    ]}>
                      {tipo.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.switchContainer}>
                <Text style={styles.label}>Activo</Text>
                <Switch
                  value={formData.activo}
                  onValueChange={(value) => setFormData({...formData, activo: value})}
                  trackColor={{ false: '#E0E0E0', true: Colors.light.buttonPrimary }}
                  thumbColor={formData.activo ? Colors.light.buttonText : '#FFFFFF'}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleGuardar}
              >
                <Text style={styles.confirmBtnText}>Guardar</Text>
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.light.buttonPrimary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.inputText,
  },
  activeTabText: {
    color: Colors.light.buttonPrimary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
  },
  addButton: {
    backgroundColor: Colors.light.buttonPrimary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: Colors.light.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 16,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: Colors.light.buttonSecondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 4,
  },
  itemTipo: {
    fontSize: 12,
    color: Colors.light.buttonPrimary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.light.inputText,
    marginRight: 4,
  },
  statusValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  activo: {
    color: Colors.light.success,
  },
  inactivo: {
    color: Colors.light.error,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    backgroundColor: Colors.light.buttonSecondary,
    padding: 8,
    borderRadius: 6,
  },
  editBtnText: {
    fontSize: 16,
  },
  deleteBtn: {
    backgroundColor: Colors.light.buttonPrimary,
    padding: 8,
    borderRadius: 6,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.inputText,
    textAlign: 'center',
    marginTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: Colors.light.inputText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(94, 51, 111, 0.7)', // Morado oscuro con opacidad
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.light.inputBackground,
    color: Colors.light.inputText,
  },
  tipoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipoButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    alignItems: 'center',
  },
  tipoButtonActive: {
    backgroundColor: Colors.light.buttonPrimary,
    borderColor: Colors.light.buttonPrimary,
  },
  tipoButtonText: {
    color: Colors.light.inputText,
    fontWeight: 'bold',
  },
  tipoButtonTextActive: {
    color: Colors.light.buttonText,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.inputBorder,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.light.inputText,
    fontWeight: 'bold',
  },
  confirmBtn: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.buttonPrimary,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: Colors.light.buttonText,
    fontWeight: 'bold',
  },
}); 